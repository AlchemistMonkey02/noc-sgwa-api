const selfComplianceService = require("./self-compliance.service");
const documentService = require("../documents/document.service"); // Reusing document service for upload logic

class SelfComplianceController {

    /**
     * POST /api/self-compliance/start
     * Start or resume session
     */
    async startSession(req, res, next) {
        try {
            const { applicationId } = req.body;
            if (!applicationId) {
                return res.status(400).json({ success: false, message: "applicationId is required" });
            }

            const session = await selfComplianceService.startSession(req.user.id, applicationId);

            res.status(200).json({
                success: true,
                data: session
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/self-compliance/:id/step
     * Submit step data
     */
    async submitStep(req, res, next) {
        try {
            const { id } = req.params; // complianceId
            const { step, responses } = req.body;

            const session = await selfComplianceService.submitStepData(id, req.user.id, step, responses);

            res.status(200).json({
                success: true,
                data: session,
                message: `Step ${step} data saved`
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/self-compliance/:id/upload
     * Upload evidence document
     */
    async uploadDocument(req, res, next) {
        try {
            const { id } = req.params; // complianceId
            if (!req.file) {
                return res.status(400).json({ success: false, message: "No file uploaded" });
            }

            const documentType = req.body.documentType || "OTHER";

            // 1. Upload to Document Service first
            // We pass complianceId as a reference if needed, or link it later. 
            // Better to link explicitly via service.
            const files = [req.file];
            const uploadedDocs = await documentService.uploadDocuments(
                files,
                req.user.id,
                req.company?._id || null,
                documentType,
                { description: `Self Compliance Evidence for ${id}` }
            );

            const docId = uploadedDocs[0].documentId;

            // 2. Link to Compliance Session
            const session = await selfComplianceService.linkDocument(id, req.user.id, docId, documentType);

            res.status(200).json({
                success: true,
                data: session,
                message: "Document uploaded and linked"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/self-compliance/:id/submit
     * Final Submission
     */
    async submitCompliance(req, res, next) {
        try {
            const { id } = req.params;

            const session = await selfComplianceService.finalizeSubmission(id, req.user.id);

            res.status(200).json({
                success: true,
                data: session,
                message: `Compliance ${session.validationResult?.autoStatus === 'AUTO_APPROVED' ? 'AUTO-APPROVED' : 'Submitted'}`
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/self-compliance/:id/status
     * Get Session Status
     */
    async getStatus(req, res, next) {
        try {
            const { id } = req.params;
            const session = await selfComplianceService.getSession(id, req.user.id);

            res.status(200).json({
                success: true,
                data: session
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SelfComplianceController();
