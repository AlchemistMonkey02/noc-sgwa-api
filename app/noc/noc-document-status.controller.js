const nocService = require("./noc.service");
const { validateDocumentCompleteness } = require("./noc-document-validator");

class NOCDocumentController {
    /**
     * GET /api/applications/noc/:id/documents/status
     * Check document upload status for NOC application
     */
    async checkDocumentStatus(req, res, next) {
        try {
            const application = await nocService.getApplicationById(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            const validation = await validateDocumentCompleteness(
                application,
                application.userId,
                application.companyId
            );

            res.status(200).json({
                success: true,
                data: {
                    applicationId: application.applicationId,
                    applicationNumber: application.applicationNumber,
                    documentStatus: validation,
                    canSubmit: validation.isComplete,
                },
                message: validation.isComplete
                    ? "All required documents uploaded"
                    : `${validation.missingDocuments.length} document(s) still required`,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NOCDocumentController();
