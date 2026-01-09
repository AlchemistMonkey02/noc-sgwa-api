const nocService = require("./noc.service");

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
                ...result,
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
            const application = await nocService.submitApplication(req.params.id, req.user.id);

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
            const application = await nocService.withdrawApplication(req.params.id, req.user.id);

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
                count: queries.length,
                data: queries,
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
            const application = await nocService.trackApplication(req.params.applicationNumber);

            res.status(200).json({
                success: true,
                data: application,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/certificate
     * Download NOC certificate
     */
    async getCertificate(req, res, next) {
        try {
            const application = await nocService.getApplicationById(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            if (!application.nocCertificateId) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "CERTIFICATE_NOT_FOUND",
                        message: "NOC certificate not yet issued",
                    },
                });
            }

            // TODO: Generate and serve PDF
            res.status(200).json({
                success: true,
                data: application.nocCertificateId,
                message: "Certificate found (PDF generation pending)",
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
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: summary
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
            const status = await nocService.getSectionCompletionStatus(req.params.id);

            res.status(200).json({
                success: true,
                data: status
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
            const validation = await nocService.validateSection(id, parseInt(sectionNumber));

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
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: progress
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
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: timeline
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
                req.user.id
            );

            res.status(200).json({
                success: true,
                count: documents.length,
                data: documents
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
                req.user.id
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
                req.user.id
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
                req.user.id
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
                req.user.id
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
                req.user.id
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
                req.user.id
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
     * GET /api/applications/noc/:id/calculate-fees
     * Calculate application fees (Section 7: GW Charges)
     */
    async calculateFees(req, res, next) {
        try {
            const feeCalculation = await nocService.calculateApplicationFees(
                req.params.id,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: feeCalculation,
                message: "Fees calculated successfully"
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
}

module.exports = new NOCController();

