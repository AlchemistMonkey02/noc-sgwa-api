const documentService = require("./document.service");
const path = require("path");
const logger = require("../utils/logger");

class DocumentController {
    /**
     * POST /api/documents/upload/single
     * Upload a single document
     */
    async uploadSingleDocument(req, res, next) {
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

            const userId = req.user.id;
            const companyId = req.body.companyId || req.company?._id || null;

            // Service expects an array of files
            const files = [req.file];

            const documents = await documentService.uploadDocuments(
                files,
                userId,
                companyId,
                req.body.documentType || "OTHER",
                { applicationId: req.body.applicationId }
            );

            res.status(201).json({
                success: true,
                data: documents[0], // Return single object
                message: "Document uploaded successfully",
            });
        } catch (error) {
            next(error);
        }
    }

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
                req.body.documentType || "OTHER",
                { applicationId: req.body.applicationId }
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

            // Validation removed

            const userId = req.user.id;
            const companyId = req.body.companyId || req.company?._id || null;

            const documents = await documentService.uploadDocuments(
                req.files,
                userId,
                companyId,
                documentTypes,
                { applicationId: req.body.applicationId }
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

            // Validation removed

            const userId = req.user.id;
            const companyId = req.body.companyId || req.company?._id || null;

            const documents = await documentService.uploadDocuments(
                req.files,
                userId,
                companyId,
                documentTypes,
                { applicationId: req.body.applicationId }
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

            // Validation removed

            const userId = req.user.id;
            const companyId = req.body.companyId || req.company?._id || null;

            const documents = await documentService.uploadDocuments(
                req.files,
                userId,
                companyId,
                documentTypes,
                { applicationId: req.body.applicationId }
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

            // Validation removed

            const userId = req.user.id;
            const companyId = req.body.companyId || req.company?._id || null;

            const documents = await documentService.uploadDocuments(
                req.files,
                userId,
                companyId,
                documentTypes,
                { applicationId: req.body.applicationId }
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

            // Normalize path for cross-platform compatibility
            // Replace backslashes with forward slashes to ensure Linux systems can resolve it
            // path.resolve handles forward slashes correctly on Windows too
            const normalizedPath = document.filePath.replace(/\\/g, '/');
            const absolutePath = path.resolve(normalizedPath);

            // Check if file exists before sending
            const fs = require('fs');
            if (!fs.existsSync(absolutePath)) {
                logger.error(`File missing at path: ${absolutePath} (Original: ${document.filePath})`);
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "FILE_NOT_FOUND",
                        message: "Physical file not found on server"
                    }
                });
            }

            // Set headers for download
            res.set({
                "Content-Type": document.mimeType,
                "Content-Disposition": `attachment; filename="${document.originalFilename}"`,
                "Content-Length": document.fileSize,
            });

            // Send file
            res.sendFile(absolutePath);
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

            if (!document.filePath) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "FILE_PATH_MISSING",
                        message: "Document file path is missing from records"
                    }
                });
            }

            // Normalize path for cross-platform compatibility
            const normalizedPath = document.filePath.replace(/\\/g, '/');
            const absolutePath = path.resolve(normalizedPath);

            // Check if file exists before sending
            const fs = require('fs');
            if (!fs.existsSync(absolutePath)) {
                logger.error(`File missing at path: ${absolutePath} (Original: ${document.filePath})`);
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "FILE_NOT_FOUND",
                        message: "Physical file not found on server"
                    }
                });
            }

            // Set headers for inline view
            res.set({
                "Content-Type": document.mimeType,
                "Content-Disposition": "inline",
            });

            // Send file
            res.sendFile(absolutePath);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/documents/:id/details
     * Get document details (metadata and verification status)
     */
    async getDocumentDetails(req, res, next) {
        try {
            const { id } = req.params;

            const document = await documentService.getDocument(
                id,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: document,
            });
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

    /**
     * GET /api/documents/tracking/:trackingId
     * Get documents by tracking ID
     * Query params: ?documentsOnly=true (returns only documents array)
     */
    async getDocumentsByTrackingId(req, res, next) {
        try {
            const { trackingId } = req.params;
            const documentsOnly = req.query.documentsOnly === 'true';

            const result = await documentService.getDocumentsByTrackingId(trackingId, documentsOnly);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/documents/application/:applicationId
     * Get documents by application ID
     */
    async getDocumentsByApplicationId(req, res, next) {
        try {
            const { applicationId } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role || req.user.userType; // Handle both potential property names

            const documents = await documentService.getDocumentsByApplicationId(applicationId, userId, userRole);

            res.status(200).json({
                success: true,
                data: documents
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/officer/[role]/documents/:documentId/verify
     * Three-way document verification
     */
    async verifyDocumentThreeWay(req, res, next) {
        try {
            const { documentId } = req.params;
            const { status, remarks } = req.body;
            const officerId = req.user.id;
            const officerRole = req.user.role;

            const document = await documentService.verifyDocumentThreeWay(
                documentId,
                officerId,
                officerRole,
                { status, remarks }
            );

            res.status(200).json({
                success: true,
                data: document,
                message: "Document verified successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/documents/link
     * Link document(s) to application
     */
    async linkDocumentToApplication(req, res, next) {
        try {
            const { documentId, documentIds, applicationId } = req.body;

            if (!applicationId) {
                throw {
                    statusCode: 400,
                    code: "MISSING_FIELDS",
                    message: "applicationId is required"
                };
            }

            let result;
            if (documentIds && Array.isArray(documentIds)) {
                result = await documentService.linkDocumentsToApplication(
                    documentIds,
                    applicationId,
                    req.user.id
                );
            } else if (documentId) {
                result = await documentService.linkDocumentToApplication(
                    documentId,
                    applicationId,
                    req.user.id
                );
            } else {
                throw {
                    statusCode: 400,
                    code: "MISSING_FIELDS",
                    message: "Either documentId or documentIds is required"
                };
            }

            res.status(200).json({
                success: true,
                data: result,
                message: result.message || "Document(s) linked successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/documents/:id/verify-ai
     * AI Verification Check
     */
    async verifyDocumentAI(req, res, next) {
        try {
            const { id } = req.params;
            let { verified, valid, confidence, remarks } = req.body;  // verified/valid: boolean, confidence: number (opt), remarks: string (opt)

            // Allow 'valid' as alias for 'verified'
            if (verified === undefined && valid !== undefined) {
                verified = valid;
            }

            if (typeof verified !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_INPUT",
                        message: "The 'verified' (or 'valid') field must be a boolean (true/false)."
                    }
                });
            }

            const document = await documentService.verifyDocumentAI(
                id,
                verified,
                confidence,
                remarks
            );

            res.status(200).json({
                success: true,
                data: document,
                message: `Document AI verification ${verified ? "successful" : "failed"}`
            });
        } catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/documents/:id/verify-ai
     * Trigger AI Verification Process (Action)
     */
    async triggerAIVerification(req, res, next) {
        try {
            const { id } = req.params;
            const aiVerificationService = require('./ai-verification.service');

            // Trigger the verification process (this might be async/long-running)
            // For now, we await it, but for production, this should be offloaded to a queue
            const result = await aiVerificationService.performVerification(id);

            res.status(200).json({
                success: true,
                data: result,
                message: "AI Verification process triggered successfully"
            });
        } catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/documents/:id/claim
     * Claim a temporary document and link to current user
     */
    async claimDocument(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const document = await documentService.linkDocumentToUser(id, userId);

            res.status(200).json({
                success: true,
                data: document,
                message: "Document claimed successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DocumentController();
