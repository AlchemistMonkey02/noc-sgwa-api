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
                nocNumber: data.nocNumber,
                applicationNumber: data.applicationNumber,
                issueDate: formatDate(data.issueDate),
                validFrom: formatDate(data.validFrom),
                validUpto: formatDate(data.validUpto),
                submittedDate: formatDate(data.submittedDate),
                companyName: data.companyName,
                address: data.address,
                purpose: data.purpose,
                approvedWaterQuantity: data.approvedWaterQuantity,
                approvedWaterQuantityAnnual: (data.approvedWaterQuantity * 365).toFixed(2),
                district: data.district,
                block: data.block,
                district: data.district,
                block: data.block,
                validityYears: data.validityYears
            };

            // Merge all data fields to ensure new Annexure 13 fields are passed
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
}

module.exports = new PDFService();
