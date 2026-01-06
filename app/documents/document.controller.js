const documentService = require("./document.service");
const path = require("path");
const logger = require("../utils/logger");

class DocumentController {
    /**
     * POST /api/documents/upload
     * Upload documents
     */
    async uploadDocuments(req, res, next) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "NO_FILES",
                        message: "No files provided",
                    },
                });
            }

            const { applicationId } = req.body;
            const documents = await documentService.uploadDocuments(
                req.files,
                req.user.id,
                applicationId
            );

            res.status(201).json({
                success: true,
                count: documents.length,
                data: documents.map((doc) => ({
                    documentId: doc.documentId,
                    documentType: doc.documentType,
                    documentName: doc.documentName,
                    originalFilename: doc.originalFilename,
                    fileSize: doc.fileSize,
                    fileSizeMB: doc.fileSizeMB,
                    uploadedAt: doc.uploadedAt,
                })),
                message: `${documents.length} document(s) uploaded successfully`,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/documents
     * Get user's documents
     */
    async getDocuments(req, res, next) {
        try {
            const { documentType, applicationId, status } = req.query;

            const documents = await documentService.getUserDocuments(req.user.id, {
                documentType,
                applicationId,
                status,
            });

            res.status(200).json({
                success: true,
                count: documents.length,
                data: documents,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/documents/:id/download
     * Download document
     */
    async downloadDocument(req, res, next) {
        try {
            const { id } = req.params;

            const document = await documentService.getDocument(
                id,
                req.user.id,
                req.user.userType
            );

            // Set headers for download
            res.set({
                "Content-Type": document.mimeType,
                "Content-Disposition": `attachment; filename="${document.originalFilename}"`,
                "Content-Length": document.fileSize,
            });

            // Send file
            res.sendFile(path.resolve(document.filePath));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/documents/:id/view
     * View document inline (for PDFs/images)
     */
    async viewDocument(req, res, next) {
        try {
            const { id } = req.params;

            const document = await documentService.getDocument(
                id,
                req.user.id,
                req.user.userType
            );

            // Set headers for inline view
            res.set({
                "Content-Type": document.mimeType,
                "Content-Disposition": "inline",
            });

            // Send file
            res.sendFile(path.resolve(document.filePath));
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/documents/:id
     * Delete document
     */
    async deleteDocument(req, res, next) {
        try {
            const { id } = req.params;

            const result = await documentService.deleteDocument(id, req.user.id);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/documents/:id/verify (Officer only)
     * Verify or reject document
     */
    async verifyDocument(req, res, next) {
        try {
            const { id } = req.params;
            const { isVerified, rejectionReason } = req.body;

            const document = await documentService.verifyDocument(
                id,
                req.user.id,
                isVerified,
                rejectionReason
            );

            res.status(200).json({
                success: true,
                data: document,
                message: `Document ${isVerified ? "verified" : "rejected"} successfully`,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DocumentController();
