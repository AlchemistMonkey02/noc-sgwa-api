const documentService = require("./document.service");
const path = require("path");
const logger = require("../utils/logger");

class DocumentController {
    /**
     * POST /api/documents/upload
     * Upload documents with automatic user and company linking
     */
    async uploadDocument(req, res, next) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "NO_FILES",
                        message: "No files uploaded",
                    },
                });
            }

            const userId = req.user.id;  // From auth token

            // CompanyId is optional - from req.body or req.company (if middleware used)
            const companyId = req.body.companyId || req.company?._id || null;

            const documents = await documentService.uploadDocuments(
                req.files,
                userId,
                companyId,
                req.body.documentType || "OTHER"
            );

            res.status(201).json({
                success: true,
                data: documents,
                message: `${documents.length} document(s) uploaded successfully`,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/documents/upload/identity
     * Upload identity documents (Aadhar, PAN)
     */
    async uploadIdentityDocuments(req, res, next) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "NO_FILES",
                        message: "No files uploaded",
                    },
                });
            }

            const allowedTypes = ["AADHAR", "PAN", "AFFIDAVIT", "INDEMNITY_BOND"];
            const documentTypes = req.body.documentTypes || req.body.documentType || "AADHAR";

            // Validate document types
            const types = Array.isArray(documentTypes)
                ? documentTypes
                : documentTypes.split(',').map(t => t.trim());

            for (const type of types) {
                if (!allowedTypes.includes(type)) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: "INVALID_DOCUMENT_TYPE",
                            message: `Document type '${type}' not allowed for identity uploads.`,
                            allowedTypes,
                        },
                    });
                }
            }

            const userId = req.user.id;
            const companyId = req.body.companyId || req.company?._id || null;

            const documents = await documentService.uploadDocuments(
                req.files,
                userId,
                companyId,
                documentTypes
            );

            res.status(201).json({
                success: true,
                data: documents,
                message: `${documents.length} identity document(s) uploaded successfully`,
                category: "IDENTITY"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/documents/upload/company
     * Upload company documents
     */
    async uploadCompanyDocuments(req, res, next) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "NO_FILES",
                        message: "No files uploaded",
                    },
                });
            }

            const allowedTypes = [
                "GST_CERTIFICATE", "MSME_CERTIFICATE", "INCORPORATION_CERTIFICATE",
                "PARTNERSHIP_DEED", "PAN", "TRADE_LICENSE", "FACTORY_LICENSE"
            ];
            const documentTypes = req.body.documentTypes || req.body.documentType || "OTHER";

            // Validate document types
            const types = Array.isArray(documentTypes)
                ? documentTypes
                : documentTypes.split(',').map(t => t.trim());

            for (const type of types) {
                if (!allowedTypes.includes(type)) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: "INVALID_DOCUMENT_TYPE",
                            message: `Document type '${type}' not allowed for company uploads.`,
                            allowedTypes,
                        },
                    });
                }
            }

            const userId = req.user.id;
            const companyId = req.body.companyId || req.company?._id || null;

            const documents = await documentService.uploadDocuments(
                req.files,
                userId,
                companyId,
                documentTypes
            );

            res.status(201).json({
                success: true,
                data: documents,
                message: `${documents.length} company document(s) uploaded successfully`,
                category: "COMPANY"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/documents/upload/noc
     * Upload NOC-specific documents
     */
    async uploadNOCDocuments(req, res, next) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "NO_FILES",
                        message: "No files uploaded",
                    },
                });
            }

            const allowedTypes = [
                "PUMPING_TEST_REPORT", "HYDROGEOLOGICAL_REPORT", "WATER_QUALITY_REPORT",
                "WATER_ANALYSIS", "CONSERVATION_PLAN", "RAINWATER_HARVESTING_PLAN",
                "GREEN_BELT_PLAN", "WATER_AUDIT_REPORT", "RECYCLING_PLAN",
                "LAND_OWNERSHIP", "KHASRA_KHATAUNI", "REVENUE_RECORDS",
                "LEASE_DEED", "SALE_DEED", "SITE_PLAN", "BUILDING_PLAN",
                "LAYOUT_PLAN", "UNDERTAKING", "BOREWELL_COMPLETION_REPORT",
                "SOIL_INVESTIGATION_REPORT", "GEOPHYSICAL_SURVEY"
            ];
            const documentTypes = req.body.documentTypes || req.body.documentType || "OTHER";

            // Validate document types
            const types = Array.isArray(documentTypes)
                ? documentTypes
                : documentTypes.split(',').map(t => t.trim());

            for (const type of types) {
                if (!allowedTypes.includes(type)) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: "INVALID_DOCUMENT_TYPE",
                            message: `Document type '${type}' not allowed for NOC uploads.`,
                            allowedTypes,
                        },
                    });
                }
            }

            const userId = req.user.id;
            const companyId = req.body.companyId || req.company?._id || null;

            const documents = await documentService.uploadDocuments(
                req.files,
                userId,
                companyId,
                documentTypes
            );

            res.status(201).json({
                success: true,
                data: documents,
                message: `${documents.length} NOC document(s) uploaded successfully`,
                category: "NOC"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/documents/upload/clearances
     * Upload clearance/license documents
     */
    async uploadClearanceDocuments(req, res, next) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "NO_FILES",
                        message: "No files uploaded",
                    },
                });
            }

            const allowedTypes = [
                "EXISTING_NOC", "EC_CERTIFICATE", "CTO_CTE",
                "POLLUTION_NOC", "FOREST_CLEARANCE"
            ];
            const documentTypes = req.body.documentTypes || req.body.documentType || "OTHER";

            // Validate document types
            const types = Array.isArray(documentTypes)
                ? documentTypes
                : documentTypes.split(',').map(t => t.trim());

            for (const type of types) {
                if (!allowedTypes.includes(type)) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: "INVALID_DOCUMENT_TYPE",
                            message: `Document type '${type}' not allowed for clearance uploads.`,
                            allowedTypes,
                        },
                    });
                }
            }

            const userId = req.user.id;
            const companyId = req.body.companyId || req.company?._id || null;

            const documents = await documentService.uploadDocuments(
                req.files,
                userId,
                companyId,
                documentTypes
            );

            res.status(201).json({
                success: true,
                data: documents,
                message: `${documents.length} clearance document(s) uploaded successfully`,
                category: "CLEARANCE"
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
