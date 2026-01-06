const Document = require("./document.model");
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

class DocumentService {
    /**
     * Upload documents
     */
    async uploadDocuments(files, userId, applicationId = null) {
        try {
            const documents = [];

            for (const file of files) {
                const documentId = uuidv4();

                const document = new Document({
                    documentId,
                    userId,
                    applicationId,
                    documentType: file.fieldname.toUpperCase(),
                    documentName: file.fieldname,
                    originalFilename: file.originalname,
                    storedFilename: file.filename,
                    filePath: file.path,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    uploadedAt: new Date(),
                });

                await document.save();
                documents.push(document);

                logger.info(`Document uploaded: ${documentId}`, {
                    userId,
                    documentType: file.fieldname,
                    fileSize: file.size,
                });
            }

            return documents;
        } catch (error) {
            logger.error("Error uploading documents", error);
            throw error;
        }
    }

    /**
     * Get document by ID with access verification
     */
    async getDocument(documentId, userId, userType) {
        try {
            const document = await Document.findOne({ documentId });

            if (!document) {
                throw {
                    statusCode: 404,
                    code: "DOCUMENT_NOT_FOUND",
                    message: "Document not found",
                };
            }

            // Access control
            const isOwner = document.userId.toString() === userId;
            const isOfficer = ["DGO", "RSGWA", "ENFORCEMENT"].includes(userType);

            if (!isOwner && !isOfficer) {
                throw {
                    statusCode: 403,
                    code: "UNAUTHORIZED_ACCESS",
                    message: "You do not have permission to access this document",
                };
            }

            return document;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user's documents
     */
    async getUserDocuments(userId, filters = {}) {
        try {
            const query = { userId };

            if (filters.documentType) {
                query.documentType = filters.documentType;
            }

            if (filters.applicationId) {
                query.applicationId = filters.applicationId;
            }

            if (filters.status) {
                query.status = filters.status;
            }

            const documents = await Document.find(query)
                .select("-filePath")
                .sort({ uploadedAt: -1 });

            return documents;
        } catch (error) {
            logger.error("Error fetching user documents", error);
            throw error;
        }
    }

    /**
     * Delete document (only if not attached to submitted application)
     */
    async deleteDocument(documentId, userId) {
        try {
            const document = await Document.findOne({ documentId });

            if (!document) {
                throw {
                    statusCode: 404,
                    code: "DOCUMENT_NOT_FOUND",
                    message: "Document not found",
                };
            }

            // Check ownership
            if (document.userId.toString() !== userId) {
                throw {
                    statusCode: 403,
                    code: "UNAUTHORIZED_ACCESS",
                    message: "You can only delete your own documents",
                };
            }

            // Check if attached to application (future validation)
            if (document.applicationId) {
                // TODO: Check if application is submitted
                // For now, allow deletion
            }

            // Delete physical file
            try {
                await fs.unlink(document.filePath);
            } catch (fileError) {
                logger.warn(`Failed to delete physical file: ${document.filePath}`, fileError);
                // Continue with database deletion even if file deletion fails
            }

            // Delete from database
            await Document.deleteOne({ documentId });

            logger.info(`Document deleted: ${documentId}`, { userId });

            return { message: "Document deleted successfully" };
        } catch (error) {
            logger.error("Error deleting document", error);
            throw error;
        }
    }

    /**
     * Verify document (officer only)
     */
    async verifyDocument(documentId, officerId, isVerified, rejectionReason = null) {
        try {
            const document = await Document.findOne({ documentId });

            if (!document) {
                throw {
                    statusCode: 404,
                    code: "DOCUMENT_NOT_FOUND",
                    message: "Document not found",
                };
            }

            document.isVerified = isVerified;
            document.status = isVerified ? "VERIFIED" : "REJECTED";
            document.verifiedBy = officerId;
            document.verifiedAt = new Date();

            if (!isVerified && rejectionReason) {
                document.rejectionReason = rejectionReason;
            }

            await document.save();

            logger.info(`Document ${isVerified ? "verified" : "rejected"}: ${documentId}`, {
                officerId,
            });

            return document;
        } catch (error) {
            logger.error("Error verifying document", error);
            throw error;
        }
    }
}

module.exports = new DocumentService();
