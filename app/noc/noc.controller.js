const nocService = require("./noc.service");
const NOCApplication = require("./noc-application.model");
const notificationService = require("../notifications/notification.service");

class NOCController {
    /**
     * POST /api/applications/noc
     * Create or update draft application
     */
    async createOrUpdateApplication(req, res, next) {
        try {
            // Automatically add userId and companyId from middleware
            const applicationData = {
                ...req.body,
                userId: req.user.id,           // From auth middleware
                companyId: req.company._id,    // From company middleware
            };

            const application = await nocService.createOrUpdateApplication(
                applicationData,
                req.user.id
            );

            res.status(req.body.applicationId ? 200 : 201).json({
                success: true,
                data: application,
                message: req.body.applicationId
                    ? "Application updated successfully"
                    : "Application created successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc
     * Get user's applications
     */
    async getUserApplications(req, res, next) {
        try {
            const result = await nocService.getUserApplications(req.user.id, req.query);

            res.status(200).json({
                success: true,
                data: result.applications || result,
                pagination: result.pagination,
                message: "Applications retrieved successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id
     * Get application details
     */
    async getApplicationById(req, res, next) {
        try {
            const application = await nocService.getApplicationById(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: application,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/summary
     * Get compiled application summary (with calculated fees and populated fields)
     */
    async getApplicationSummary(req, res, next) {
        try {
            const summary = await nocService.getApplicationSummary(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: summary,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/download
     * Download application details as PDF
     */
    async downloadApplication(req, res, next) {
        try {
            const application = await nocService.getApplicationById(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            if (!application) {
                return res.status(404).json({ success: false, message: "Application not found" });
            }

            res.status(200).json({
                success: true,
                data: application,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/payment
     * Save Payment and Final Fee Details
     */
    async savePaymentDetails(req, res, next) {
        try {
            const result = await nocService.savePaymentDetails(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Payment details saved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/download
            const path = require('path');
            const fs = require('fs');

            // Construct simple HTML summary
            const htmlContent = `
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                        h1 { text-align: center; color: #1a56db; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                        h2 { color: #4b5563; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
                        .flex-row { display: flex; flex-wrap: wrap; margin-bottom: 10px; }
                        .label { font-weight: bold; width: 250px; color: #6b7280; }
                        .value { flex: 1; color: #111827; }
                        .section { margin-bottom: 25px; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
                    </style>
                </head>
                <body>
                    <h1>NOC Application Summary</h1>
                    
                    <div class="section">
                        <h2>General Details</h2>
                        <div class="flex-row"><div class="label">Application No.:</div><div class="value">${application.applicationNumber || 'N/A'}</div></div>
                        <div class="flex-row"><div class="label">Status:</div><div class="value">${application.status || 'N/A'}</div></div>
                        <div class="flex-row"><div class="label">Applied Date:</div><div class="value">${application.appliedDate ? new Date(application.appliedDate).toLocaleDateString('en-IN') : 'N/A'}</div></div>
                        <div class="flex-row"><div class="label">Industry/Project:</div><div class="value">${application.projectDetails?.projectName || 'N/A'}</div></div>
                        <div class="flex-row"><div class="label">Category:</div><div class="value">${application.projectDetails?.projectCategory || 'N/A'}</div></div>
                    </div>

                    <div class="section">
                        <h2>Location Details</h2>
                        <div class="flex-row"><div class="label">Address:</div><div class="value">${application.locationDetails?.address || 'N/A'}</div></div>
                        <div class="flex-row"><div class="label">State:</div><div class="value">${application.locationDetails?.state || 'N/A'}</div></div>
                        <div class="flex-row"><div class="label">District:</div><div class="value">${application.locationDetails?.district || 'N/A'}</div></div>
                        <div class="flex-row"><div class="label">Block:</div><div class="value">${application.locationDetails?.block || 'N/A'}</div></div>
                        <div class="flex-row"><div class="label">Coordinates:</div><div class="value">${application.locationDetails?.latitude || 'N/A'}, ${application.locationDetails?.longitude || 'N/A'}</div></div>
                    </div>

                    <div class="section">
                        <h2>Water Requirement</h2>
                        <div class="flex-row"><div class="label">Industrial Use (m3/day):</div><div class="value">${application.waterRequirement?.industrialUse || 0}</div></div>
                        <div class="flex-row"><div class="label">Domestic Use (m3/day):</div><div class="value">${application.waterRequirement?.domesticUse || 0}</div></div>
                        <div class="flex-row"><div class="label">Total Ground Water Req.:</div><div class="value">${application.waterRequirement?.totalGroundWater || 0}</div></div>
                    </div>

                    <p style="text-align: center; margin-top: 50px; font-size: 0.9em; color: #9ca3af;">
                        Generated securely via SGWA Portal at ${new Date().toLocaleString('en-IN')}
                    </p>
                </body>
                </html>
            `;

            // Prepare output path
            const uploadDir = path.join(__dirname, '../../uploads/temp');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const fileName = `Application_${application.applicationNumber || req.params.id}.pdf`;
            const filePath = path.join(uploadDir, fileName);

            // Generate PDF
            await pdfService.generatePDF(htmlContent, filePath, {
                format: 'A4',
                printBackground: true,
                margin: { top: '30px', bottom: '30px', left: '30px', right: '30px' }
            });

            // Stream response and cleanup
            res.download(filePath, fileName, (err) => {
                if (err) {
                    if (!res.headersSent) {
                        next(err);
                    }
                }
                // Cleanup temp file after sending
                setTimeout(() => {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }, 5000);
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id
     * Update application (alias for create/update)
     */
    async updateApplication(req, res, next) {
        try {
            req.body.applicationId = req.params.id;
            const application = await nocService.createOrUpdateApplication(req.body, req.user.id);

            res.status(200).json({
                success: true,
                data: application,
                message: "Application updated successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/submit
     * Submit application for review
     */
    async submitApplication(req, res, next) {
        try {
            const application = await nocService.submitApplication(req.params.id, req.user.id, req.user.userType);

            res.status(200).json({
                success: true,
                data: {
                    applicationId: application.applicationId,
                    applicationNumber: application.applicationNumber,
                    status: application.status,
                    feeDetails: application.feeDetails,
                },
                message: "Application submitted successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/withdraw
     * Withdraw application
     */
    async withdrawApplication(req, res, next) {
        try {
            const application = await nocService.withdrawApplication(req.params.id, req.user.id, req.user.userType);

            res.status(200).json({
                success: true,
                data: application,
                message: "Application withdrawn successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/queries
     * Get application queries
     */
    async getApplicationQueries(req, res, next) {
        try {
            const queries = await nocService.getApplicationQueries(req.params.id);

            res.status(200).json({
                success: true,
                data: queries,
                count: queries.length,
                message: "Queries retrieved successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/queries/:queryId/respond
     * Respond to query
     */
    async respondToQuery(req, res, next) {
        try {
            const query = await nocService.respondToQuery(
                req.params.queryId,
                req.body.response,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: query,
                message: "Query responded successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/track/:applicationNumber (Public)
     * Track application status
     */
    async trackApplication(req, res, next) {
        try {
            // Support capturing ID with slashes
            const appNum = req.params[0] || req.params.applicationNumber || req.params.id;
            const application = await nocService.trackApplication(appNum);

            res.status(200).json({
                success: true,
                data: application,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/ref/:trackingId/document
     * Get NOC Document by Tracking ID (Public)
     */
    async getNocDocumentByTrackingId(req, res, next) {
        try {
            const filePath = await nocService.getCertificateByTrackingId(req.params.trackingId);

            const fs = require('fs');
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "FILE_NOT_FOUND_ON_DISK",
                        message: "Certificate file missing from storage"
                    }
                });
            }

            const fileName = `NOC_${req.params.trackingId}.pdf`;
            res.download(filePath, fileName, (err) => {
                if (err) {
                    if (!res.headersSent) {
                        next(err);
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/ref/:trackingId/documents
     * Get Application Documents by Tracking ID (Public)
     */
    async getDocumentsByTrackingId(req, res, next) {
        try {
            const documents = await nocService.getDocumentsByTrackingId(
                req.params.trackingId,
                req.user
            );

            res.status(200).json({
                success: true,
                data: documents,
                count: documents.length,
                message: "Documents retrieved successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/certificate
     * View NOC certificate details
     */
    async getCertificate(req, res, next) {
        try {
            const certificate = await nocService.getCertificate(
                req.params.id,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: certificate,
                message: "Certificate details fetched successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/certificate/download
     * Download NOC certificate (PDF)
     */
    async downloadCertificate(req, res, next) {
        try {
            const filePath = await nocService.getCertificateFilePath(
                req.params.id,
                req.user.id
            );

            const fs = require('fs');
            const path = require('path');

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "FILE_NOT_FOUND_ON_DISK",
                        message: "Certificate file missing from storage"
                    }
                });
            }

            // Set filename for download
            const fileName = `NOC_${req.params.id}.pdf`;
            res.download(filePath, fileName, (err) => {
                if (err) {
                    if (!res.headersSent) {
                        next(err);
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // ========== NEW: Section-wise Update Controllers ==========

    /**
     * PUT /api/applications/noc/:id/section1
     * Update Section 1: Basic Details
     */
    async updateSection1(req, res, next) {
        try {
            const application = await nocService.updateSection1(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 1 updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section2
     * Update Section 2: Location Details
     */
    async updateSection2(req, res, next) {
        try {
            const application = await nocService.updateSection2(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 2 updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section3
     * Update Section 3: Drinking & Domestic Use
     */
    async updateSection3(req, res, next) {
        try {
            const application = await nocService.updateSection3(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 3 updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section4
     * Update Section 4: Water Requirement Breakup
     */
    async updateSection4(req, res, next) {
        try {
            const application = await nocService.updateSection4(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 4 updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section5
     * Update Section 5: Ground Water Structures
     */
    async updateSection5(req, res, next) {
        try {
            const application = await nocService.updateSection5(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 5 updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section6
     * Update Section 6: Document Attachments
     */
    async updateSection6(req, res, next) {
        try {
            const application = await nocService.updateSection6(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 6 updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET/POST /api/applications/noc/:id/calculate-fees
     * Calculate application fees (Section 7)
     * Supports both GET (auto-fetch) and POST (manual inputs)
     */
    async calculateFees(req, res, next) {
        try {
            const feeCalculationService = require('./fee-calculation.service');

            // Manual inputs from request body (if POST) or query (if GET)
            const manualInputs = req.method === 'POST' ? req.body : req.query;

            const feeDetails = await feeCalculationService.calculateFees(
                req.params.id,
                manualInputs
            );

            res.status(200).json({
                success: true,
                data: feeDetails,
                message: "Fees calculated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/summary
     * Get application summary (Section 8)
     */
    async getApplicationSummary(req, res, next) {
        try {
            const summary = await nocService.getApplicationSummary(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: summary,
                message: "Application summary fetched successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/validate
     * AI-driven pre-submission validation
     */
    async validateApplication(req, res, next) {
        try {
            const validatorService = require('./application-validator.service');

            const validationResults = await validatorService.validateBeforeSubmission(req.params.id);

            res.status(200).json({
                success: true,
                data: validationResults,
                message: validationResults.canSubmit
                    ? "Application is ready for submission"
                    : "Application needs improvements before submission"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/section-status
     * Get section completion status
     */
    async getSectionStatus(req, res, next) {
        try {
            const status = await nocService.getSectionCompletionStatus(req.params.id, req.user.id, req.user.userType);

            res.status(200).json({
                success: true,
                data: status,
                message: "Section status retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/validate-section/:sectionNumber
     * Validate specific section
     */
    async validateSection(req, res, next) {
        try {
            const { id, sectionNumber } = req.params;
            const validation = await nocService.validateSection(id, parseInt(sectionNumber), req.user.id, req.user.userType);

            res.status(200).json({
                success: validation.isValid,
                data: validation,
                message: validation.isValid ? "Section is valid" : "Section has validation errors"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/progress
     * Get application progress
     */
    async getApplicationProgress(req, res, next) {
        try {
            const progress = await nocService.getApplicationProgress(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: progress,
                message: "Application progress retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/timeline
     * Get detailed timeline
     */
    async getApplicationTimeline(req, res, next) {
        try {
            const timeline = await nocService.getApplicationTimeline(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: timeline,
                message: "Application timeline retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/approval-flow
     * Get approval flow status only
     */
    async getApprovalFlow(req, res, next) {
        try {
            const approvalFlow = await nocService.getApprovalFlow(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: approvalFlow,
                message: "Approval flow status retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/documents
     * Link documents to application
     */
    async linkDocuments(req, res, next) {
        try {
            const { documentIds } = req.body;

            const application = await nocService.linkDocuments(
                req.params.id,
                documentIds,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application.documents,
                message: "Documents linked successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/documents
     * Get application documents
     */
    async getApplicationDocuments(req, res, next) {
        try {
            const documents = await nocService.getApplicationDocuments(
                req.params.id,
                req.user
            );

            res.status(200).json({
                success: true,
                data: documents,
                count: documents.length,
                message: "Application documents retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // SECTION-WISE UPDATE METHODS (8-Section CGWA Workflow)
    // ============================================

    /**
     * PUT /api/applications/noc/:id/section1
     * Update Section 1: Basic Details
     */
    async updateSection1(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                1,
                req.body,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 1 (Basic Details) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section2
     * Update Section 2: Location Details
     */
    async updateSection2(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                2,
                req.body,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 2 (Location Details) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section3
     * Update Section 3: Drinking & Domestic Use
     */
    async updateSection3(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                3,
                req.body,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 3 (Drinking & Domestic Use) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section4
     * Update Section 4: Water Requirement Breakup
     */
    async updateSection4(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                4,
                req.body,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 4 (Water Requirement Breakup) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section5
     * Update Section 5: Ground Water Structures
     */
    async updateSection5(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                5,
                req.body,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 5 (Ground Water Structures) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section6
     * Update Section 6: Document Attachments
     */
    async updateSection6(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                6,
                req.body,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 6 (Document Attachments) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section7
     * Update Section 7: Fee Details
     */
    async updateSection7(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                7,
                req.body,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 7 (Fee Details) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section8
     * Update Section 8: Final Summary / Undertaking
     */
    async updateSection8(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                8,
                req.body,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 8 (Final Summary) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section9
     * Update Section 9: Digital Flow Meter
     */
    async updateSection9(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                9,
                req.body,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 9 (Digital Flow Meter) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/flow-meter
     * Update Digital Flow Meter (Section 9 Alias)
     */
    async updateDigitalFlowMeter(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                9,
                req.body,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Digital Flow Meter details updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/track/:applicationId
     * Track application status and timeline
     */
    async trackApplication(req, res, next) {
        try {
            // Handle wildcard route: applicationId might be in params.applicationId or params[0]
            const applicationId = req.params.applicationId || req.params[0];

            // Fetch application by applicationId (UUID) OR applicationNumber OR trackingId
            const application = await NOCApplication.findOne({
                $or: [
                    { applicationId: applicationId },
                    { applicationNumber: applicationId },
                    { trackingId: applicationId }
                ]
            })
                .select("applicationId applicationNumber trackingId projectType applicationType submittedAt status workflowHistory applicationCategory");

            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: "Application not found"
                });
            }

            // Status Hierarchy/Rank
            const statusRank = {
                "DRAFT": 0,
                "SUBMITTED": 1,

                // DGO (Level 2)
                "PENDING_DGO_REVIEW": 2, "UNDER_REVIEW_DGO": 2, "QUERY_RAISED_DGO": 2, "REJECTED_DGO": 2,
                "APPROVED_DGO": 3,

                // SGWA (Level 4)
                "PENDING_SGWA_REVIEW": 4, "UNDER_REVIEW_SGWA": 4, "QUERY_RAISED_SGWA": 4, "REJECTED_SGWA": 4,
                "APPROVED_SGWA": 5,

                // Enforcement (Level 6)
                "PENDING_ENFORCEMENT_REVIEW": 6, "INSPECTION_SCHEDULED": 6, "INSPECTED": 6, "UNDER_REVIEW_ENFORCEMENT": 6, "QUERY_RAISED_ENFORCEMENT": 6, "REJECTED_ENFORCEMENT": 6,
                "APPROVED_ENFORCEMENT": 7,

                // Final (Level 8)
                "NOC_ISSUED": 8, "WITHDRAWN": 8
            };

            const currentRank = statusRank[application.status] || 0;
            let currentLocation = "Applicant";
            if (currentRank === 1) currentLocation = "System Processing";
            else if (currentRank >= 2 && currentRank < 4) currentLocation = "District Groundwater Office (DGO)";
            else if (currentRank >= 4 && currentRank < 6) currentLocation = "State Groundwater Authority (SGWA)";
            else if (currentRank >= 6 && currentRank < 8) currentLocation = "Enforcement Wing";
            else if (currentRank === 8) currentLocation = "Issued";

            // Map Status to Timeline Steps
            const timeline = [
                {
                    step: 1,
                    title: "Application Submitted",
                    description: "Application received by system.",
                    status: "COMPLETED",
                    date: application.submittedAt
                },
                {
                    step: 2,
                    title: "Document Verification",
                    description: "Initial scrutiny of uploaded documents (DGO).",
                    status: currentRank >= 3 ? "COMPLETED" : "PENDING",
                },
                {
                    step: 3,
                    title: "SGWA Review",
                    description: "Verification by State Ground Water Authority.",
                    status: currentRank >= 5 ? "COMPLETED" : "PENDING",
                },
                {
                    step: 4,
                    title: "Enforcement Wing",
                    description: "Final verification by Enforcement Wing.",
                    status: currentRank >= 7 ? "COMPLETED" : "PENDING",
                },
                {
                    step: 5,
                    title: "Final Approval",
                    description: "NOC generated and ready for download.",
                    status: currentRank >= 8 ? "COMPLETED" : "PENDING",
                }
            ];

            res.status(200).json({
                success: true,
                data: {
                    applicationId: application.applicationId,
                    applicationNumber: application.applicationNumber,
                    trackingId: application.trackingId,
                    status: application.status,
                    projectName: application.projectType,
                    applicationType: application.applicationType,
                    category: application.applicationCategory,
                    submittedDate: application.submittedAt,
                    currentLocation: currentLocation,
                    timeline: timeline
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/approve-step
     * Manually approve timeline steps (No Auth)
     */
    async updateTimelineStep(req, res, next) {
        try {
            const { applicationId, step } = req.body;

            if (!applicationId || !step) {
                return res.status(400).json({ success: false, message: "applicationId and step are required" });
            }

            // Find by any ID
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(applicationId);
            const query = isObjectId ? { _id: applicationId } : {
                $or: [
                    { applicationId: applicationId },
                    { applicationNumber: applicationId },
                    { trackingId: applicationId }
                ]
            };

            const application = await NOCApplication.findOne(query);

            if (!application) {
                return res.status(404).json({ success: false, message: "Application not found" });
            }

            let newStatus = application.status;
            const now = new Date();

            switch (parseInt(step)) {
                case 2: // Document Verification & DGO
                    if (application.approvalFlow.dgo) {
                        application.approvalFlow.dgo.status = "APPROVED";
                        application.approvalFlow.dgo.documentsVerified = true;
                        application.approvalFlow.dgo.reviewedAt = now;
                    }
                    newStatus = "IN_PROGRESS";
                    break;
                case 3: // SGWA
                    if (application.approvalFlow.dgo && application.approvalFlow.dgo.status !== "APPROVED") {
                        application.approvalFlow.dgo.status = "APPROVED";
                        application.approvalFlow.dgo.documentsVerified = true;
                        application.approvalFlow.dgo.reviewedAt = now;
                    }
                    if (application.approvalFlow.sgwa) {
                        application.approvalFlow.sgwa.status = "APPROVED";
                        application.approvalFlow.sgwa.reviewedAt = now;
                    }
                    newStatus = "IN_PROGRESS";
                    break;
                case 4: // Enforcement
                    if (application.approvalFlow.sgwa && application.approvalFlow.sgwa.status !== "APPROVED") {
                        application.approvalFlow.sgwa.status = "APPROVED";
                        application.approvalFlow.sgwa.reviewedAt = now;
                    }
                    if (application.approvalFlow.enforcement) {
                        application.approvalFlow.enforcement.status = "APPROVED";
                        application.approvalFlow.enforcement.reviewedAt = now;
                    }
                    newStatus = "IN_PROGRESS";
                    break;
                case 5: // Final NOC
                    if (application.approvalFlow.enforcement && application.approvalFlow.enforcement.status !== "APPROVED") {
                        application.approvalFlow.enforcement.status = "APPROVED";
                        application.approvalFlow.enforcement.reviewedAt = now;
                    }
                    newStatus = "NOC_ISSUED";
                    break;
                default:
                    return res.status(400).json({ success: false, message: "Invalid step (2-5)" });
            }

            application.status = newStatus;

            // Mark modified for nested objects
            application.markModified('approvalFlow');

            await application.save({ validateBeforeSave: false });

            // Send notification
            notificationService.send(application.userId, newStatus, {
                applicationNumber: application.applicationNumber,
                projectName: application.projectDetails?.projectName || 'Project',
            }).catch(err => console.error("Failed to send notification", err));

            res.status(200).json({
                success: true,
                message: `Application moved to step ${step} (Status: ${newStatus})`,
                data: {
                    applicationId: application.applicationId,
                    status: application.status,
                    approvalFlow: application.approvalFlow
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/payment
     * Save payment details
     */
    async savePaymentDetails(req, res, next) {
        try {
            // Right now, this acts as a stub that saves the payment data to the application's 'payment' or 'step7' field
            // if needed. The actual submission happens later.
            const application = await NOCApplication.findOne({
                $or: [
                    { _id: req.params.id },
                    { applicationId: req.params.id },
                    { trackingId: req.params.id }
                ]
            });

            if (!application) {
                return res.status(404).json({ success: false, message: "Application not found" });
            }

            // You could save this data to a 'payments' collection or update the application doc directly
            application.feeDetails = {
                ...application.feeDetails,
                ...req.body,
                paymentDate: new Date()
            };

            await application.save({ validateBeforeSave: false });

            res.status(200).json({
                success: true,
                message: "Payment details saved successfully",
                data: application.feeDetails
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/processing-estimates
     * Get estimated processing timelines (Best/Normal/Delayed)
     */
    async getProcessingEstimates(req, res, next) {
        try {
            const { allApproved, almostApproved, maybeApproved } = req.query;

            const estimates = {
                bestCase: {
                    label: "Best Case",
                    conditions: ["Documents correct", "Inspection completed in first visit", "Area category already mapped"],
                    duration: "~30–45 days",
                    color: "green"
                },
                normalCase: {
                    label: "Normal Case",
                    conditions: ["Standard verification & inspection"],
                    duration: "~45–60 days",
                    color: "yellow"
                },
                delayedCase: {
                    label: "Delayed Case",
                    conditions: ["Clarification required", "Re-inspection", "Incomplete hydro data"],
                    duration: "60–90+ days",
                    color: "red"
                }
            };

            let data = estimates;

            // Filter logic based on input flags
            if (allApproved === 'true') {
                data = { selectedEstimate: estimates.bestCase };
            } else if (almostApproved === 'true') {
                data = { selectedEstimate: estimates.normalCase };
            } else if (maybeApproved === 'true') { // Or 'delayed'
                data = { selectedEstimate: estimates.delayedCase };
            }

            res.status(200).json({
                success: true,
                data: data,
                message: "Processing estimates retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }


    /**
     * GET /api/applications/noc/:id/summary
     * Get application summary (Section 8: Summary & Payment)
     */
    async getApplicationSummary(req, res, next) {
        try {
            const summary = await nocService.getApplicationSummary(
                req.params.id,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: summary,
                message: "Application summary retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/calculate-discharge
     * Calculate pump discharge rate
     */
    async calculatePumpDischarge(req, res, next) {
        try {
            const pumpCalculationService = require("./pump-calculation.service");
            const { pumpCapacityHP, depthMeters, efficiency, operatingHours } = req.body;

            const result = pumpCalculationService.calculateDischarge(
                parseFloat(pumpCapacityHP),
                parseFloat(depthMeters),
                efficiency ? parseFloat(efficiency) : undefined,
                operatingHours ? parseFloat(operatingHours) : undefined
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Pump discharge calculated successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NOCController();

