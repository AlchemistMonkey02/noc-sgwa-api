const nocService = require("./noc.service");
const NOCApplication = require("./noc-application.model");
const notificationService = require("../notifications/notification.service");
const logger = require("../utils/logger");

// Helper for section updates
const _updateSection = async (req, res, next, sectionNumber) => {
    try {
        const application = await nocService.updateSection(
            req.params.id,
            sectionNumber,
            req.body,
            req.user.id,
            req.user.userType
        );

        res.status(200).json({
            success: true,
            data: application,
            message: `Section ${sectionNumber} updated successfully`
        });
    } catch (error) {
        next(error);
    }
};

const NOCController = {
    /**
     * POST /api/applications/noc
     * Create or update draft application
     */
    createOrUpdateApplication: async (req, res, next) => {
        try {
            const applicationData = {
                ...req.body,
                userId: req.user.id,
                companyId: req.company?._id || req.user.companyId,
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
    },

    /**
     * GET /api/applications/noc
     * Get user's applications
     */
    getUserApplications: async (req, res, next) => {
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
    },

    /**
     * GET /api/applications/noc/:id
     * Get application details
     */
    getApplicationById: async (req, res, next) => {
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
    },

    /**
     * GET /api/applications/noc/:id/summary
     * Get compiled application summary (Section 8)
     */
    getApplicationSummary: async (req, res, next) => {
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
    },

    /**
     * GET /api/applications/noc/:id/download
     * Download application details as PDF
     */
    downloadApplication: async (req, res, next) => {
        try {
            const pdfService = require("../services/pdf.service");
            const application = await nocService.getApplicationById(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "APPLICATION_NOT_FOUND",
                        message: "Application not found"
                    }
                });
            }

            const filePath = await pdfService.generateApplicationSummary(application);
            const fileName = `Application_${(application.applicationNumber || req.params.id).replace(/\//g, "-")}.pdf`;

            res.download(filePath, fileName, (err) => {
                const fs = require('fs');
                if (err && !res.headersSent) {
                    next(err);
                }
                // Cleanup temp file after sending
                setTimeout(() => {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }, 10000);
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/applications/noc/:id/submit
     * Submit application for review
     */
    submitApplication: async (req, res, next) => {
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
    },

    /**
     * POST /api/applications/noc/:id/withdraw
     * Withdraw application
     */
    withdrawApplication: async (req, res, next) => {
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
    },

    // ========== Section-wise Update Methods ==========

    updateSection1: async (req, res, next) => _updateSection(req, res, next, 1),
    updateSection2: async (req, res, next) => _updateSection(req, res, next, 2),
    updateSection3: async (req, res, next) => _updateSection(req, res, next, 3),
    updateSection4: async (req, res, next) => _updateSection(req, res, next, 4),
    updateSection5: async (req, res, next) => _updateSection(req, res, next, 5),
    updateSection6: async (req, res, next) => _updateSection(req, res, next, 6),
    updateSection7: async (req, res, next) => _updateSection(req, res, next, 7),
    updateSection8: async (req, res, next) => _updateSection(req, res, next, 8),
    updateSection9: async (req, res, next) => _updateSection(req, res, next, 9),

    /**
     * GET/POST /api/applications/noc/:id/calculate-fees
     */
    calculateFees: async (req, res, next) => {
        try {
            const feeCalculationService = require('./fee-calculation.service');
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
    },

    /**
     * GET /api/applications/noc/:id/progress
     */
    getApplicationProgress: async (req, res, next) => {
        try {
            const progress = await nocService.getApplicationProgress(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: progress,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/applications/track/:id
     */
    trackApplication: async (req, res, next) => {
        try {
            const id = req.params.applicationNumber || req.params.id || req.params[0];
            const tracking = await nocService.trackApplication(id);

            res.status(200).json({
                success: true,
                data: tracking,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/applications/noc/:id/timeline
     */
    getApplicationTimeline: async (req, res, next) => {
        try {
            const timeline = await nocService.getApplicationTimeline(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: timeline,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/applications/noc/:id/approval-flow
     */
    getApprovalFlow: async (req, res, next) => {
        try {
            const approvalFlow = await nocService.getApprovalFlow(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: approvalFlow,
            });
        } catch (error) {
            next(error);
        }
    },

    // ========== Query Handlers ==========

    getApplicationQueries: async (req, res, next) => {
        try {
            const queries = await nocService.getApplicationQueries(req.params.id);
            res.status(200).json({
                success: true,
                data: queries,
                count: queries.length
            });
        } catch (error) {
            next(error);
        }
    },

    respondToQuery: async (req, res, next) => {
        try {
            const query = await nocService.respondToQuery(
                req.params.queryId,
                req.body.response,
                req.user.id
            );
            res.status(200).json({
                success: true,
                data: query,
                message: "Query responded successfully"
            });
        } catch (error) {
            next(error);
        }
    },

    // ========== Document Handlers ==========

    linkDocuments: async (req, res, next) => {
        try {
            const application = await nocService.linkDocuments(
                req.params.id,
                req.body.documentIds,
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
    },

    getApplicationDocuments: async (req, res, next) => {
        try {
            const documents = await nocService.getApplicationDocuments(req.params.id, req.user);
            res.status(200).json({
                success: true,
                data: documents,
                count: documents.length
            });
        } catch (error) {
            next(error);
        }
    },

    downloadCertificate: async (req, res, next) => {
        try {
            const filePath = await nocService.getCertificateFilePath(req.params.id, req.user.id);
            const fs = require('fs');
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ success: false, message: "Certificate file missing" });
            }
            res.download(filePath, `NOC_${req.params.id}.pdf`);
        } catch (error) {
            next(error);
        }
    },

    // ========== Utility Calculations ==========

    calculatePumpDischarge: async (req, res, next) => {
        try {
            const pumpCalculationService = require("./pump-calculation.service");
            const result = pumpCalculationService.calculateDischarge(
                parseFloat(req.body.pumpCapacityHP),
                parseFloat(req.body.depthMeters),
                req.body.efficiency ? parseFloat(req.body.efficiency) : 0.6,
                req.body.operatingHours ? parseFloat(req.body.operatingHours) : 1
            );
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/applications/noc/approve-step (Internal Utility)
     */
    updateTimelineStep: async (req, res, next) => {
        try {
            const { applicationId, step } = req.body;
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(applicationId);
            const query = isObjectId ? { _id: applicationId } : {
                $or: [{ applicationId }, { applicationNumber: applicationId }, { trackingId: applicationId }]
            };
            const application = await NOCApplication.findOne(query);
            if (!application) return res.status(404).json({ success: false, message: "Application not found" });

            let newStatus = application.status;
            const now = new Date();
            const stepNum = parseInt(step);

            if (stepNum >= 2) {
                application.approvalFlow.dgo.status = "APPROVED";
                application.approvalFlow.dgo.reviewedAt = now;
                application.approvalFlow.dgo.documentsVerified = true;
                newStatus = "IN_PROGRESS";
            }
            if (stepNum >= 3) {
                application.approvalFlow.sgwa.status = "APPROVED";
                application.approvalFlow.sgwa.reviewedAt = now;
            }
            if (stepNum >= 4) {
                application.approvalFlow.enforcement.status = "APPROVED";
                application.approvalFlow.enforcement.reviewedAt = now;
            }
            if (stepNum === 5) {
                newStatus = "NOC_ISSUED";
                application.updatedAt = now;
            }

            application.status = newStatus;
            application.markModified('approvalFlow');
            await application.save({ validateBeforeSave: false });

            res.status(200).json({ success: true, message: `Moved to step ${step}`, status: newStatus });
        } catch (error) {
            next(error);
        }
    },

    // ========== Missing Methods (Stubs to prevent crash) ==========

    getProcessingEstimates: async (req, res, next) => {
        res.status(501).json({ success: false, message: "getProcessingEstimates not implemented" });
    },

    getNocDocumentByTrackingId: async (req, res, next) => {
        try {
            const trackingId = req.params.trackingId || req.params[0];
            const filePath = await nocService.getCertificateByTrackingId(trackingId);
            const fs = require('fs');
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ success: false, message: "Certificate file missing" });
            }
            res.download(filePath, `NOC_${(req.params.trackingId || req.params[0]).replace(/\//g, "-")}.pdf`);
        } catch (error) {
            next(error);
        }
    },

    getDocumentsByTrackingId: async (req, res, next) => {
        try {
            const trackingId = req.params.trackingId || req.params[0];
            const documents = await nocService.getDocumentsByTrackingId(trackingId, req.user);
            res.status(200).json({
                success: true,
                data: documents,
                message: "Documents retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    },

    getCertificate: async (req, res, next) => {
        try {
            const certificate = await nocService.getCertificate(req.params.id, req.user.id);
            res.status(200).json({
                success: true,
                data: certificate,
                message: "Certificate details fetched successfully"
            });
        } catch (error) {
            next(error);
        }
    },

    validateApplication: async (req, res, next) => {
        try {
            const progress = await nocService.getApplicationProgress(
                req.params.id,
                req.user.id,
                req.user.userType
            );
            res.status(200).json({
                success: true,
                data: progress,
                message: "Application validation completed"
            });
        } catch (error) {
            next(error);
        }
    },

    getSectionStatus: async (req, res, next) => {
        try {
            const status = await nocService.getSectionCompletionStatus(
                req.params.id,
                req.user.id,
                req.user.userType
            );
            res.status(200).json({
                success: true,
                data: status,
                message: "Section status retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    },

    validateSection: async (req, res, next) => {
        try {
            const result = await nocService.validateSection(
                req.params.id,
                parseInt(req.params.sectionNumber),
                req.user.id,
                req.user.userType
            );
            res.status(200).json({
                success: true,
                data: result,
                message: "Section validation completed"
            });
        } catch (error) {
            next(error);
        }
    },

    updateApplication: async (req, res, next) => {
        try {
            const application = await nocService.createOrUpdateApplication(
                { ...req.body, applicationId: req.params.id },
                req.user.id
            );
            res.status(200).json({
                success: true,
                data: application,
                message: "Application updated successfully"
            });
        } catch (error) {
            next(error);
        }
    },

    updateDigitalFlowMeter: async (req, res, next) => {
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
                message: "Flow meter details updated successfully"
            });
        } catch (error) {
            next(error);
        }
    },

    savePaymentDetails: async (req, res, next) => {
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
};

module.exports = NOCController;
