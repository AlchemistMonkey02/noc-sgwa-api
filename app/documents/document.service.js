const Document = require("./document.model");
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

class DocumentService {
    /**
     * Upload documents with automatic user and company linking
     */
    async uploadDocuments(files, userId, companyId, documentTypes = "OTHER", options = {}) {
        try {
            const uploadedDocs = [];

            // If userId is null/undefined, this is a public upload
            const isPublicUpload = !userId;

            // Parse documentTypes (can be single string, array, or comma-separated string)
            let typesArray = [];
            if (Array.isArray(documentTypes)) {
                typesArray = documentTypes;
            } else if (typeof documentTypes === 'string' && documentTypes.includes(',')) {
                typesArray = documentTypes.split(',').map(t => t.trim());
            } else {
                typesArray = [documentTypes];
            }

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const documentId = uuidv4();

                // Use corresponding type or default to OTHER
                const documentType = typesArray[i] || typesArray[0] || "OTHER";

                const document = new Document({
                    documentId,
                    userId,
                    companyId,  // Automatically linked from token/request
                    applicationId: options.applicationId,
                    documentType,
                    documentName: options.description || file.originalname, // Use description if provided as name
                    description: options.description, // If schema supports it
                    originalFilename: file.originalname,
                    storedFilename: file.filename,
                    // Store normalized path (always use forward slashes for DB consistency)
                    filePath: file.path.replace(/\\/g, '/'),
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    uploadedAt: new Date(),
                });

                await document.save();

                uploadedDocs.push({
                    documentId: document.documentId,
                    _id: document._id,
                    fileName: document.originalFilename,
                    documentType: document.documentType,
                    fileSize: document.fileSize,
                    uploadedAt: document.uploadedAt,
                    userId: document.userId || null,
                    companyId: document.companyId,
                    filePath: document.filePath,
                    mimeType: document.mimeType,
                });

                logger.info(`Document uploaded: ${documentId}`, {
                    userId,
                    companyId,
                    fileName: file.originalname,
                });
            }

            return uploadedDocs;
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
            const mongoose = require("mongoose");
            const isObjectId = mongoose.Types.ObjectId.isValid(documentId);
            const query = isObjectId
                ? { $or: [{ _id: documentId }, { documentId: documentId }] }
                : { documentId };

            let document = await Document.findOne(query);

            // Fallback: Check embedded documents in NOCApplication if not found
            if (!document) {
                const NOCApplication = require("../noc/noc-application.model");
                const app = await NOCApplication.findOne({ "documents.documentId": documentId });

                if (app && app.documents) {
                    const embeddedDoc = app.documents.find(d => d.documentId === documentId);
                    if (embeddedDoc) {
                        // Create a temporary Mongoose document-like object or return raw object with extra props check
                        document = {
                            ...embeddedDoc.toObject ? embeddedDoc.toObject() : embeddedDoc,
                            userId: app.userId, // Inherit ownership from application
                            applicationId: app.applicationId
                        };
                    }
                }
            }

            if (!document) {
                throw {
                    statusCode: 404,
                    code: "DOCUMENT_NOT_FOUND",
                    message: "Document not found",
                };
            }

            // Access control - ensure both sides are strings for comparison
            const isOwner = document.userId.toString() === userId.toString();
            // Also allow if company matches (for company documents)
            // But we need to ensure the user owns the company? 
            // Simplified: if user owns document OR is officer.

            const isOfficer = ["DGO", "SGWA", "RSGWA", "ENFORCEMENT", "INSPECTION"].includes(userType);

            if (!isOwner && !isOfficer) {
                // If checking company ownership is needed, we'd need to look up company
                // For now, stricter is safer.
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
    /**
     * Get documents by application tracking ID
     */
    async getDocumentsByTrackingId(trackingId, documentsOnly = false) {
        try {
            const NOCApplication = require("../noc/noc-application.model");

            // Find application by tracking ID
            const application = await NOCApplication.findOne({ trackingId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found with this tracking ID"
                };
            }

            // Get embedded documents from application
            const documents = application.documents || [];

            // If user wants only documents, return just the array
            if (documentsOnly) {
                return documents;
            }

            // Otherwise return with application info
            return {
                application: {
                    applicationId: application.applicationId,
                    applicationNumber: application.applicationNumber,
                    trackingId: application.trackingId,
                    status: application.status
                },
                documents
            };
        } catch (error) {
            logger.error("Error fetching documents by tracking ID", error);
            throw error;
        }
    }

    /**
     * Get documents by application ID
     * Returns embedded documents from NOC application
     */
    async getDocumentsByApplicationId(applicationId, userId = null, userRole = null) {
        try {
            const query = { applicationId };

            // Enforce ownership if userId is provided and not an officer
            // List of officer roles who can see all documents
            const officerRoles = ["DGO", "SGWA", "RSGWA", "ENFORCEMENT", "INSPECTION_OFFICER", "ADMIN"];

            // If we have user info, and they are NOT an officer, filter by userId
            if (userId && userRole && !officerRoles.includes(userRole)) {
                query.userId = userId;
            }

            // 1. Fetch from Document Collection
            const standaloneDocs = await Document.find(query)
                .select("-filePath")
                .sort({ uploadedAt: -1 });

            // 2. Fetch from NOCApplication (Embedded) to catch legacy/embedded-only docs
            const NOCApplication = require("../noc/noc-application.model");
            const appQuery = { applicationId };

            // Re-apply ownership check for application query
            if (query.userId) {
                appQuery.userId = query.userId;
            }

            const application = await NOCApplication.findOne(appQuery).select("documents");
            const embeddedDocs = application && application.documents ? application.documents : [];

            // 3. Merge Strategies
            const docMap = new Map();

            // A. Add embedded docs first (legacy source)
            embeddedDocs.forEach(doc => {
                docMap.set(doc.documentId, doc);
            });

            // B. Add/Overwrite with standalone docs (newer source)
            standaloneDocs.forEach(doc => {
                const existing = docMap.get(doc.documentId);
                let merged = doc.toObject(); // Convert mongoose doc to object

                if (existing) {
                    // Sync verification if missing in standalone
                    if (!merged.verification && existing.verification) {
                        merged.verification = existing.verification;
                    }
                    if ((!merged.documentType || merged.documentType === 'OTHER') && existing.documentType) {
                        merged.documentType = existing.documentType;
                    }
                }
                docMap.set(doc.documentId, merged);
            });

            return Array.from(docMap.values());
        } catch (error) {
            logger.error("Error fetching documents by application ID", error);
            throw error;
        }
    }

    /**
     * Verify document with three-way approval (DGO/SGWA/Enforcement)
     */
    async verifyDocumentThreeWay(documentId, officerId, officerRole, verificationData) {
        try {
            const document = await Document.findOne({ documentId });

            if (!document) {
                throw {
                    statusCode: 404,
                    code: "DOCUMENT_NOT_FOUND",
                    message: "Document not found"
                };
            }

            const roleMap = {
                "DGO": "dgo",
                "SGWA": "sgwa",
                "ENFORCEMENT": "enforcement"
            };

            const verificationRole = roleMap[officerRole];
            if (!verificationRole) {
                throw {
                    statusCode: 403,
                    code: "INVALID_ROLE",
                    message: "Invalid role for document verification"
                };
            }

            // Update verification for specific role
            if (!document.verification) {
                document.verification = {};
            }
            if (!document.verification[verificationRole]) {
                document.verification[verificationRole] = {};
            }

            document.verification[verificationRole] = {
                verified: verificationData.status === "APPROVED",
                verifiedBy: officerId,
                verifiedAt: new Date(),
                remarks: verificationData.remarks || "",
                status: verificationData.status || "APPROVED"
            };

            // Update legacy fields for backward compatibility
            if (verificationData.status === "APPROVED") {
                document.status = "VERIFIED";
                document.isVerified = true;
            } else if (verificationData.status === "REJECTED") {
                document.status = "REJECTED";
                document.isVerified = false;
                document.rejectionReason = verificationData.remarks;
            }

            document.verifiedBy = officerId;
            document.verifiedAt = new Date();

            await document.save();

            logger.info(`Document verified by ${officerRole}: ${documentId}`, {
                officerId,
                status: verificationData.status
            });

            return document;
        } catch (error) {
            logger.error("Error in three-way document verification", error);
            throw error;
        }
    }

    /**
     * Link document to application
     */
    async linkDocumentToApplication(documentId, applicationId, userId) {
        try {
            // Re-use bulk implementation for single document
            return await this.linkDocumentsToApplication([documentId], applicationId, userId);
        } catch (error) {
            logger.error("Error linking document", error);
            throw error;
        }
    }

    /**
     * Link multiple documents to application
     */
    async linkDocumentsToApplication(documentIds, applicationId, userId) {
        try {
            const Document = require("./document.model");
            const NOCApplication = require("../noc/noc-application.model");

            if (!Array.isArray(documentIds) || documentIds.length === 0) {
                throw {
                    statusCode: 400,
                    code: "INVALID_INPUT",
                    message: "documentIds must be a non-empty array"
                };
            }

            // 1. Fetch all documents
            // We use $in to get all documents at once
            const documents = await Document.find({
                $or: [
                    { documentId: { $in: documentIds } },
                    { _id: { $in: documentIds } }
                ]
            });

            if (documents.length !== documentIds.length) {
                // Some documents might not exist
                // Ideally we should report which ones, but for now just error
                // Filter out found IDs to see which are missing if needed
                throw {
                    statusCode: 404,
                    code: "DOCUMENT_NOT_FOUND",
                    message: "One or more documents not found"
                };
            }

            // 2. Verify ownership of ALL documents
            const nonOwnedDocs = documents.filter(doc => doc.userId.toString() !== userId);
            if (nonOwnedDocs.length > 0) {
                throw {
                    statusCode: 403,
                    code: "UNAUTHORIZED_ACCESS",
                    message: "You can only link your own documents"
                };
            }

            // 3. Fetch Application
            const application = await NOCApplication.findOne({ applicationId });
            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found"
                };
            }

            // 4. Verify Application ownership
            if (application.userId.toString() !== userId) {
                throw {
                    statusCode: 403,
                    code: "UNAUTHORIZED_ACCESS",
                    message: "You can only link documents to your own applications"
                };
            }

            // 5. Update Documents in Document Collection
            // We can use updateMany. The filter ensures we only update the ones we verified
            // Note: We use the _ids of the fetched documents to be safe
            const docObjectIds = documents.map(d => d._id);
            await Document.updateMany(
                { _id: { $in: docObjectIds } },
                { $set: { applicationId: applicationId } }
            );

            // 6. Update NOCApplication (Embedded Array)
            let newDocsAdded = 0;

            // Create a set of existing doc IDs for O(1) lookup
            const existingDocIds = new Set(application.documents.map(d => d.documentId));

            for (const doc of documents) {
                if (!existingDocIds.has(doc.documentId)) {
                    application.documents.push({
                        documentId: doc.documentId,
                        documentType: doc.documentType,
                        fileName: doc.originalFilename,
                        uploadedAt: doc.uploadedAt,
                        isVerified: false
                    });
                    newDocsAdded++;
                }
            }

            if (newDocsAdded > 0) {
                await application.save({ validateBeforeSave: false });
            }

            return {
                message: `${newDocsAdded} document(s) linked successfully`,
                linkedCount: newDocsAdded,
                totalRequested: documentIds.length,
                applicationId
            };

        } catch (error) {
            logger.error("Error linking documents", error);
            throw error;
        }
    }

    /**
     * Verify document via AI
     */
    async verifyDocumentAI(documentId, verified, confidence = 1.0, remarks = "AI Verified") {
        try {
            const document = await Document.findOne({ documentId });

            if (!document) {
                throw {
                    statusCode: 404,
                    code: "DOCUMENT_NOT_FOUND",
                    message: "Document not found"
                };
            }

            // Update Document AI Verification
            document.verification.ai = {
                verified: verified,
                confidence: confidence,
                verifiedAt: new Date(),
                remarks: remarks,
                status: verified ? "APPROVED" : "REJECTED"
            };

            await document.save();

            // Sync with NOCApplication if linked
            // Since NOCApplication embeds documents, we need to update the embedded doc too
            if (document.applicationId) {
                const NOCApplication = require("../noc/noc-application.model");
                // Find application that contains this document
                // Note: applicationId in Document is a UUID, which might match applicationId in NOCApplication
                // BUT NOCApplication actually stores documents in an array. 
                // We need to find the application by its UUID or _id (if we stored it)
                // However, simpler is to query by the documentId inside the documents array.

                // Try to find the application containing this document
                const app = await NOCApplication.findOne({ "documents.documentId": documentId });

                if (app) {
                    // Update the specific element in the array
                    const docIndex = app.documents.findIndex(d => d.documentId === documentId);
                    if (docIndex !== -1) {
                        if (!app.documents[docIndex].verification) {
                            app.documents[docIndex].verification = {};
                        }
                        app.documents[docIndex].verification.ai = document.verification.ai;
                        await app.save();
                        logger.info(`Synced AI verification to Application ${app.applicationId}`, { documentId });
                    }
                }
            }

            logger.info(`Document AI Verification ${verified ? "Approved" : "Rejected"}: ${documentId}`);

            return document;
        } catch (error) {
            logger.error("Error verifying document with AI", error);
            throw error;
        }
    }

    /**
     * Link a temporary (public) document to a user
     */
    async linkDocumentToUser(documentId, userId) {
        try {
            const document = await Document.findOne({ documentId });

            if (!document) {
                throw {
                    statusCode: 404,
                    code: "DOCUMENT_NOT_FOUND",
                    message: "Document not found"
                };
            }

            // Check if document is already linked
            if (document.userId) {
                // If it's already linked to the SAME user, return success (idempotent)
                if (document.userId.toString() === userId.toString()) {
                    return document;
                }

                throw {
                    statusCode: 400,
                    code: "DOCUMENT_ALREADY_LINKED",
                    message: "Document is already linked to a user"
                };
            }

            // Move file from temp to user folder
            const oldPath = document.filePath;
            const fileName = path.basename(oldPath);
            const documentType = document.documentType || "OTHER";

            // Construct new path: uploads/{userId}/{documentType}/{fileName}
            const newDir = path.join("uploads", userId.toString(), documentType);
            const newPath = path.join(newDir, fileName);

            // Create user directory if not exists
            await fs.mkdir(newDir, { recursive: true });

            // Move file
            // Note: filePath in DB uses forward slashes, but fs needs OS specific separators
            // newPath (via path.join) is OS specific.
            // oldPath might strictly be forward slashes from DB.
            const oldPathOS = path.resolve(oldPath);

            // Check if old file exists
            try {
                await fs.rename(oldPathOS, newPath);
            } catch (err) {
                logger.warn(`Failed to move file from ${oldPathOS} to ${newPath}: ${err.message}`);
                // If file move fails, we might still want to link the DB record? 
                // Or maybe just update the path if the move failed but we can't recover?
                // For now, let's assume if move fails, we throw.
                throw {
                    statusCode: 500,
                    code: "FILE_MOVE_ERROR",
                    message: "Failed to move document file"
                };
            }

            // Update Document Record
            document.userId = userId;
            // Store normalized path
            document.filePath = newPath.replace(/\\/g, '/');

            await document.save();

            logger.info(`Document linked to user: ${documentId} -> ${userId}`);

            return document;
        } catch (error) {
            logger.error("Error linking document to user", error);
            throw error;
        }
    }
}

module.exports = new DocumentService();
