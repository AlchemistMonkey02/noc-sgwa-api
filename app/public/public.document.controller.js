const documentService = require("../documents/document.service");

class PublicDocumentController {
    /**
     * POST /api/public/documents/upload
     * Upload a single document without authentication
     */
    async uploadPublicDocument(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "NO_FILE",
                        message: "No file uploaded",
                    },
                });
            }

            // userId is null for public uploads
            // Service expects an array of files
            const files = [req.file];

            const documents = await documentService.uploadDocuments(
                files,
                null, // No userId
                null, // No companyId
                req.body.documentType || "OTHER",
                { applicationId: req.body.applicationId }
            );

            res.status(201).json({
                success: true,
                data: documents[0], // Return single object
                message: "Document uploaded successfully (Temporary)",
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PublicDocumentController();
