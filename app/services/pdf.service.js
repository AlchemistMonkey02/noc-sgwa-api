const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger'); // Adjust path as needed

class PDFService {
    constructor() {
        this.browser = null;
    }

    async getBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
        }
        return this.browser;
    }

    /**
     * Generate PDF from HTML content
     * @param {string} htmlContent - Full HTML string
     * @param {string} outputPath - Absolute path to save the PDF
     * @param {object} options - Puppeteer PDF options
     */
    async generatePDF(htmlContent, outputPath, options = {}) {
        try {
            const browser = await this.getBrowser();
            const page = await browser.newPage();

            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            const pdfOptions = {
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                },
                path: outputPath, // Save directly to file
                ...options
            };

            await page.pdf(pdfOptions);
            await page.close();

            // We don't close the browser to reuse it, but in serverless/low-mem might want to close
            // For this persistent server, we can keep it open or close it periodically. 
            // Let's close it for safety to avoid zombie processes if the app isn't managing it well.
            await browser.close();
            this.browser = null;

            return outputPath;
        } catch (error) {
            logger.error("PDF Generation Error", error);
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
            throw error;
        }
    }

    /**
     * Generate NOC Certificate
     * @param {object} data - Data to populate the template
     */
    async generateNOCCertificate(data) {
        try {
            const templatePath = path.join(__dirname, '../templates/certificates/noc-certificate.html');
            let html = fs.readFileSync(templatePath, 'utf8');

            // Replace placeholders
            // Using a simple regex replacement for {{key}}
            const replacePlaceholder = (template, key, value) => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                return template.replace(regex, value !== undefined && value !== null ? value : '');
            };

            // Formatting dates
            const formatDate = (date) => {
                return date ? new Date(date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                }) : 'N/A';
            };

            const replacements = {
                nocNumber: data.nocNumber || 'N/A',
                applicationNumber: data.applicationNumber || 'N/A',
                issueDate: formatDate(data.issueDate),
                validFrom: formatDate(data.validFrom),
                validUpto: formatDate(data.validUpto),
                submittedDate: formatDate(data.submittedDate),
                companyName: data.companyName || 'N/A',
                projectAddress: data.address || data.projectAddress || 'N/A',
                purpose: data.purpose || 'N/A',
                approvedWaterQuantity: (data.approvedWaterQuantity || 0).toFixed(2),
                approvedWaterQuantityAnnual: ((data.approvedWaterQuantity || 0) * 365).toFixed(2),
                district: data.district || 'N/A',
                block: data.block || 'N/A',
                state: data.state || 'RAJASTHAN',
                pinCode: data.pinCode || 'N/A',
                category: data.category || 'N/A',
                nocType: (data.nocType || 'New').toUpperCase(),
                projectStatus: (data.projectStatus || 'New Project').toUpperCase(),
                validityYears: data.validityYears || 3,
                
                // Structure Counts (Existing)
                dw_ex: data.structures?.existing?.dw || 0,
                dcb_ex: data.structures?.existing?.dcb || 0,
                bw_ex: data.structures?.existing?.bw || 0,
                tw_ex: data.structures?.existing?.tw || 0,
                mpu_ex: data.structures?.existing?.mpu || 0,
                total_ex: (data.structures?.existing?.dw || 0) + (data.structures?.existing?.bw || 0) + (data.structures?.existing?.tw || 0),
                
                // Structure Counts (Proposed)
                dw_prop: data.structures?.proposed?.dw || 0,
                dcb_prop: data.structures?.proposed?.dcb || 0,
                bw_prop: data.structures?.proposed?.bw || 0,
                tw_prop: data.structures?.proposed?.tw || 0,
                mpu_prop: data.structures?.proposed?.mpu || 0,
                total_prop: (data.structures?.proposed?.dw || 0) + (data.structures?.proposed?.bw || 0) + (data.structures?.proposed?.tw || 0),
                
                // Grand Totals
                total_dw: (data.structures?.existing?.dw || 0) + (data.structures?.proposed?.dw || 0),
                total_dcb: (data.structures?.existing?.dcb || 0) + (data.structures?.proposed?.dcb || 0),
                total_bw: (data.structures?.existing?.bw || 0) + (data.structures?.proposed?.bw || 0),
                total_tw: (data.structures?.existing?.tw || 0) + (data.structures?.proposed?.tw || 0),
                total_mpu: (data.structures?.existing?.mpu || 0) + (data.structures?.proposed?.mpu || 0),
                grand_total: ((data.structures?.existing?.dw || 0) + (data.structures?.existing?.bw || 0) + (data.structures?.existing?.tw || 0)) + 
                             ((data.structures?.proposed?.dw || 0) + (data.structures?.proposed?.bw || 0) + (data.structures?.proposed?.tw || 0))
            };

            // Merge all data fields for extra flexibility
            Object.assign(replacements, data);


            // Handle Signature Image
            if (data.signaturePath && fs.existsSync(data.signaturePath)) {
                try {
                    const signatureBuffer = fs.readFileSync(data.signaturePath);
                    // Determine mime type from extension or default to png
                    const ext = path.extname(data.signaturePath).toLowerCase();
                    let mime = 'image/png';
                    if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';

                    const base64Signature = `data:${mime};base64,${signatureBuffer.toString('base64')}`;
                    replacements.signatureImage = `<img src="${base64Signature}" alt="Authorized Signature" style="max-height: 60px; max-width: 150px;">`;
                } catch (err) {
                    logger.warn("Failed to process signature image", err);
                    replacements.signatureImage = '';
                }
            } else {
                replacements.signatureImage = '';
            }

            for (const [key, value] of Object.entries(replacements)) {
                html = replacePlaceholder(html, key, value);
            }

            // Handle condition list (simple loop replacement or just joining)
            // Ideally use a template engine like Handlebars, but for simplicity:
            let conditionsHtml = '';
            if (data.conditions && Array.isArray(data.conditions)) {
                conditionsHtml = data.conditions.map(c => `<li>${c}</li>`).join('');
            }
            // Remove the handlebars-like loop block and insert the list
            // This simple regex approach is brittle for loops, so I'll just look for a specific marker or do a replace
            // In the HTML I put {{#each conditions}} ... {{/each}}
            // Let's blindly replace the whole block with the list items if I can regex it, 
            // or just replace a specific {{conditionsList}} placeholder if I modify HTML.
            // I'll modify the HTML tool call above slightly or just do a regex replace on the block

            // Regex to replace {{#each conditions}}...{{/each}}
            const loopRegex = /{{#each conditions}}([\s\S]*?){{\/each}}/;
            const match = html.match(loopRegex);
            if (match) {
                const itemTemplate = match[1]; // <li>{{this}}</li>
                const listHtml = data.conditions ? data.conditions.map(c => itemTemplate.replace('{{this}}', c)).join('') : '';
                html = html.replace(loopRegex, listHtml);
            }

            // Generate filename
            const fileName = `NOC_${data.nocNumber.replace(/\//g, '-')}.pdf`;
            const uploadDir = path.join(__dirname, '../../uploads/certificates'); // Adjust storage path

            // Ensure directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);

            await this.generatePDF(html, filePath);

            return filePath;
        } catch (error) {
            logger.error("NOC Certificate Generation Error", error);
            throw error;
        }
    }

    /**
     * Generate Application Summary PDF
     * @param {object} data - Data to populate the template
     */
    async generateApplicationSummary(data) {
        try {
            const templatePath = path.join(__dirname, '../templates/certificates/application-summary.html');
            let html = fs.readFileSync(templatePath, 'utf8');

            // Formatting dates
            const formatDate = (date) => {
                return date ? new Date(date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                }) : 'N/A';
            };

            const replacements = {
                applicationNumber: data.applicationNumber || 'N/A',
                trackingId: data.trackingId || 'N/A',
                status: (data.status || 'DRAFT').toUpperCase(),
                appliedDate: formatDate(data.appliedAt || data.createdAt),
                applicationTypeLabel: data.applicationTypeLabel || data.applicationType || 'NOC',
                projectCategory: data.projectCategory || data.projectDetails?.projectCategory || 'N/A',
                projectName: data.projectName || data.projectDetails?.projectName || 'N/A',
                organizationName: data.organizationName || 'N/A',
                projectType: data.projectType || 'N/A',
                address: data.address || data.location?.address || 'N/A',
                state: data.state || data.location?.state || 'N/A',
                district: data.district || data.location?.district || 'N/A',
                block: data.block || data.location?.block || 'N/A',
                latitude: data.latitude || data.location?.latitude || 'N/A',
                longitude: data.longitude || data.location?.longitude || 'N/A',
                industrialUse: data.waterRequirement?.industrialUse || 0,
                domesticUse: data.waterRequirement?.domesticUse || 0,
                greenBeltUse: data.waterRequirement?.greenBeltUse || 0,
                totalGroundWater: data.waterRequirement?.totalGroundWater || 0,
                generatedAt: new Date().toLocaleString('en-IN')
            };

            // Replace placeholders
            for (const [key, value] of Object.entries(replacements)) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                html = html.replace(regex, value !== undefined && value !== null ? value : '');
            }

            // Generate filename
            const fileName = `Application_${(data.applicationNumber || data.applicationId || 'Unknown').replace(/\//g, '-')}.pdf`;
            const uploadDir = path.join(__dirname, '../../uploads/temp');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);

            await this.generatePDF(html, filePath);

            return filePath;
        } catch (error) {
            logger.error("Application Summary Generation Error", error);
            throw error;
        }
    }
}

module.exports = new PDFService();
