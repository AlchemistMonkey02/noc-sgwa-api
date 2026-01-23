const Company = require("./company.model");
const Document = require("../documents/document.model");
const User = require("../auth/user.model");
const logger = require("../utils/logger");
const documentService = require("../documents/document.service");
const mongoose = require("mongoose");

class CompanyService {
    /**
     * Register a new company
     */
    async registerCompany(userId, companyData, files = null) {
        let uploadedDocIds = [];
        try {
            // Check if GST number already exists
            const existingCompany = await Company.findOne({
                gstNumber: companyData.gstNumber,
            });

            if (existingCompany) {
                throw {
                    statusCode: 400,
                    code: "DUPLICATE_COMPANY",
                    message: "A company with this GST number is already registered",
                };
            }

            // If communication address is same as registered, copy it
            if (companyData.sameAsRegistered) {
                companyData.communicationAddress = { ...companyData.registeredAddress };
            }

            // Create company instance
            const company = new Company({
                userId,
                ...companyData,
            });

            // Handle file uploads if present
            if (files && Object.keys(files).length > 0) {
                const docsToUpload = [];
                const docTypes = [];

                if (files.companyPan && files.companyPan[0]) {
                    docsToUpload.push(files.companyPan[0]);
                    docTypes.push("PAN");
                }

                if (files.gstCertificate && files.gstCertificate[0]) {
                    docsToUpload.push(files.gstCertificate[0]);
                    docTypes.push("GST_CERTIFICATE");
                }

                if (files.incorporationCertificate && files.incorporationCertificate[0]) {
                    docsToUpload.push(files.incorporationCertificate[0]);
                    docTypes.push("INCORPORATION_CERTIFICATE");
                }

                if (files.authorizationLetter && files.authorizationLetter[0]) {
                    docsToUpload.push(files.authorizationLetter[0]);
                    docTypes.push("AUTHORIZATION_LETTER");
                }

                if (docsToUpload.length > 0) {
                    const uploadedDocs = await documentService.uploadDocuments(
                        docsToUpload,
                        userId,
                        company._id, // Link to the new company ID
                        docTypes
                    );

                    // Documents are handled by DocumentService and linked via companyId.
                    // We no longer store duplicates in company.documents array.

                    // Link authorization letter to authorized person
                    const authLetter = uploadedDocs.find(d => d.documentType === "AUTHORIZATION_LETTER");
                    if (authLetter) {
                        if (!company.authorizedPerson) {
                            company.authorizedPerson = {};
                        }
                        company.authorizedPerson.authorizationLetter = authLetter._id;
                    }

                    uploadedDocIds = uploadedDocs.map(d => d.documentId);
                }
            }

            await company.save();

            logger.info(`New company registered: ${company.companyName}`, {
                companyId: company._id,
                userId,
                documentsCount: company.documents ? company.documents.length : 0
            });

            return company;
        } catch (error) {
            // Cleanup uploaded documents if company creation fails
            if (uploadedDocIds.length > 0) {
                uploadedDocIds.forEach(async (docId) => {
                    try {
                        await documentService.deleteDocument(docId, userId);
                    } catch (cleanupError) {
                        logger.error(`Failed to cleanup document ${docId} after failed registration`, cleanupError);
                    }
                });
            }

            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                throw {
                    statusCode: 400,
                    code: "DUPLICATE_ENTRY",
                    message: `${field} is already registered`,
                };
            }
            throw error;
        }
    }

    /**
     * Get all companies for a user
     */
    async getUserCompanies(userId, filters = {}) {
        try {
            const query = { userId };

            // Apply filters
            if (filters.status) {
                query.status = filters.status;
            }
            if (filters.verificationStatus) {
                query.verificationStatus = filters.verificationStatus;
            }

            const companies = await Company.find(query)
                .sort({ createdAt: -1 })
                .select("-__v");

            return companies;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get company profile (single/primary company for user)
     */
    async getCompanyProfile(userId) {
        try {
            const company = await Company.findOne({ userId })
                .populate("userId", "firstName lastName email")
                .populate("authorizedPerson.authorizationLetter")
                .select("-documents")
                .sort({ createdAt: -1 })
                .lean(); // Use lean() to get a plain JS object we can modify

            if (!company) {
                throw {
                    statusCode: 404,
                    code: "COMPANY_NOT_FOUND",
                    message: "Company profile not found",
                };
            }

            // Fetch related documents
            const documents = await Document.find({
                companyId: company._id,
                status: { $ne: "DELETED" }
            });

            // Attach specific documents to the response
            const attachDocument = (type, key) => {
                const doc = documents.find(d => d.documentType === type);
                if (doc) {
                    company[key] = doc;
                }
            };

            attachDocument("INCORPORATION_CERTIFICATE", "incorporationCertificate");
            attachDocument("PAN", "companyPan");
            attachDocument("GST_CERTIFICATE", "gstCertificate");
            // Authorization letter is already populated via mongoose populate, but we can also look it up here if needed
            // attachDocument("AUTHORIZATION_LETTER", "authorizationLetter"); 

            // If authorizedPerson.authorizationLetter is just an ID (if populate failed or wasn't set), try to find it in documents
            if (company.authorizedPerson && (!company.authorizedPerson.authorizationLetter || !company.authorizedPerson.authorizationLetter._id)) {
                const authDoc = documents.find(d => d.documentType === "AUTHORIZATION_LETTER");
                if (authDoc) {
                    company.authorizedPerson.authorizationLetter = authDoc;
                }
            }

            return company;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get company by ID
     */
    async getCompanyById(companyId, userId = null) {
        try {
            const query = { _id: companyId };

            // If userId provided, ensure company belongs to user
            if (userId) {
                query.userId = userId;
            }

            const company = await Company.findOne(query)
                .populate("userId", "firstName lastName email")
                .populate("approvedBy", "firstName lastName")
                .populate("authorizedPerson.authorizationLetter")
                .select("-documents")
                .lean();

            if (!company) {
                throw {
                    statusCode: 404,
                    code: "COMPANY_NOT_FOUND",
                    message: "Company not found",
                };
            }

            // Fetch related documents
            const documents = await Document.find({
                companyId: company._id,
                status: { $ne: "DELETED" }
            });

            // Attach specific documents to the response
            const attachDocument = (type, key) => {
                const doc = documents.find(d => d.documentType === type);
                if (doc) {
                    company[key] = doc;
                }
            };

            attachDocument("INCORPORATION_CERTIFICATE", "incorporationCertificate");
            attachDocument("PAN", "companyPan");
            attachDocument("GST_CERTIFICATE", "gstCertificate");

            // If authorizedPerson.authorizationLetter is just an ID, try to find it in documents
            if (company.authorizedPerson && (!company.authorizedPerson.authorizationLetter || !company.authorizedPerson.authorizationLetter._id)) {
                const authDoc = documents.find(d => d.documentType === "AUTHORIZATION_LETTER");
                if (authDoc) {
                    company.authorizedPerson.authorizationLetter = authDoc;
                }
            }

            return company;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update company details
     */
    async updateCompany(companyId, userId, updateData, files = null) {
        try {
            // Don't allow updating certain fields
            delete updateData.userId;
            delete updateData.verificationStatus;
            delete updateData.isApproved;
            delete updateData.approvedBy;
            delete updateData.approvedAt;

            // Handle file uploads if present
            if (files && Object.keys(files).length > 0) {
                const docsToUpload = [];
                const docTypes = [];

                if (files.companyPan && files.companyPan[0]) {
                    docsToUpload.push(files.companyPan[0]);
                    docTypes.push("PAN");
                }

                if (files.gstCertificate && files.gstCertificate[0]) {
                    docsToUpload.push(files.gstCertificate[0]);
                    docTypes.push("GST_CERTIFICATE");
                }

                if (files.incorporationCertificate && files.incorporationCertificate[0]) {
                    docsToUpload.push(files.incorporationCertificate[0]);
                    docTypes.push("INCORPORATION_CERTIFICATE");
                }

                if (files.authorizationLetter && files.authorizationLetter[0]) {
                    docsToUpload.push(files.authorizationLetter[0]);
                    docTypes.push("AUTHORIZATION_LETTER");
                }

                if (docsToUpload.length > 0) {
                    const uploadedDocs = await documentService.uploadDocuments(
                        docsToUpload,
                        userId,
                        companyId,
                        docTypes
                    );

                    // Map to company documents format and merge
                    // Documents are linked via companyId in Document collection.
                    // We no longer push to company.documents array to keep models separate/clean.
                    // if (!updateData.$push) updateData.$push = {};
                    // updateData.$push.documents = { $each: newDocs };

                    // Update authorization letter if present
                    const authLetter = uploadedDocs.find(d => d.documentType === "AUTHORIZATION_LETTER");
                    if (authLetter) {
                        if (updateData.authorizedPerson) {
                            updateData.authorizedPerson.authorizationLetter = authLetter._id;
                        } else {
                            updateData["authorizedPerson.authorizationLetter"] = authLetter._id;
                        }
                    }
                }
            }

            const updateOp = { $set: updateData };
            if (updateData.$push) {
                updateOp.$push = updateData.$push;
                delete updateData.$push;
            }

            const company = await Company.findOneAndUpdate(
                { _id: companyId, userId },
                updateOp,
                { new: true, runValidators: true }
            )
                .populate("authorizedPerson.authorizationLetter")
                .select("-documents");

            if (!company) {
                throw {
                    statusCode: 404,
                    code: "COMPANY_NOT_FOUND",
                    message: "Company not found or you don't have permission to update it",
                };
            }

            logger.info(`Company updated: ${company.companyName}`, {
                companyId: company._id,
                userId,
            });

            return company;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete company
     */
    async deleteCompany(companyId, userId) {
        try {
            const company = await Company.findOneAndDelete({
                _id: companyId,
                userId,
            });

            if (!company) {
                throw {
                    statusCode: 404,
                    code: "COMPANY_NOT_FOUND",
                    message: "Company not found or you don't have permission to delete it",
                };
            }

            logger.info(`Company deleted: ${company.companyName}`, {
                companyId: company._id,
                userId,
            });

            return { message: "Company deleted successfully" };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get company statistics for a user
     */
    async getCompanyStats(userId) {
        try {
            const stats = await Company.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: "$verificationStatus",
                        count: { $sum: 1 },
                    },
                },
            ]);

            const total = await Company.countDocuments({ userId });

            return {
                total,
                byStatus: stats.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verify company (Officer only)
     */
    async verifyCompany(companyId, officerId, action, reason = null) {
        try {
            const update = {
                verificationStatus: action === "approve" ? "VERIFIED" : "REJECTED",
                isApproved: action === "approve",
                approvedBy: officerId,
                approvedAt: new Date(),
            };

            if (action === "reject" && reason) {
                update.rejectionReason = reason;
            }

            const company = await Company.findByIdAndUpdate(
                companyId,
                { $set: update },
                { new: true }
            );

            if (!company) {
                throw {
                    statusCode: 404,
                    code: "COMPANY_NOT_FOUND",
                    message: "Company not found",
                };
            }

            logger.info(`Company ${action}d: ${company.companyName}`, {
                companyId: company._id,
                officerId,
            });

            return company;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all companies (Officer view)
     */
    async getAllCompanies(filters = {}, page = 1, limit = 20) {
        try {
            const query = {};

            if (filters.verificationStatus) {
                query.verificationStatus = filters.verificationStatus;
            }
            if (filters.status) {
                query.status = filters.status;
            }
            if (filters.companyType) {
                query.companyType = filters.companyType;
            }
            if (filters.search) {
                query.$or = [
                    { companyName: { $regex: filters.search, $options: "i" } },
                    { gstNumber: { $regex: filters.search, $options: "i" } },
                    { email: { $regex: filters.search, $options: "i" } },
                ];
            }

            const skip = (page - 1) * limit;

            const companies = await Company.find(query)
                .populate("userId", "firstName lastName email phone")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Company.countDocuments(query);

            return {
                companies,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verify company document
     */
    async verifyCompanyDocument(companyId, officerId, documentId, status, remarks) {
        try {
            const company = await Company.findById(companyId);
            if (!company) {
                throw {
                    statusCode: 404,
                    code: "COMPANY_NOT_FOUND",
                    message: "Company not found",
                };
            }

            // Find existing verification entry
            const verificationIndex = company.documentVerifications.findIndex(
                v => v.documentId.toString() === documentId
            );

            // Get document type from documents array
            const docEntry = company.documents.find(d => d.documentId.toString() === documentId);
            const documentType = docEntry ? docEntry.documentType : "UNKNOWN";

            const verificationEntry = {
                documentType,
                documentId,
                status,
                remarks,
                verifiedBy: officerId,
                verifiedAt: new Date(),
            };

            if (verificationIndex > -1) {
                // Update existing
                company.documentVerifications[verificationIndex] = verificationEntry;
            } else {
                // Add new
                company.documentVerifications.push(verificationEntry);
            }

            await company.save();

            return company;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get company documents
     */
    async getCompanyDocuments(companyId, userId = null) {
        try {
            const Document = require("../documents/document.model");

            // Check company existence and access
            const companyQuery = { _id: companyId };
            if (userId) companyQuery.userId = userId;

            const company = await Company.findOne(companyQuery);
            if (!company) {
                throw {
                    statusCode: 404,
                    code: "COMPANY_NOT_FOUND",
                    message: "Company not found or unauthorized",
                };
            }

            // Query Document model
            const documents = await Document.find({ companyId })
                .sort({ uploadedAt: -1 });

            return documents;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Upload a single company document
     */
    async uploadCompanyDocument(companyId, userId, documentType, file) {
        try {
            // Validate document type
            const validTypes = ["PAN", "GST_CERTIFICATE", "INCORPORATION_CERTIFICATE", "AUTHORIZATION_LETTER"];
            if (!validTypes.includes(documentType)) {
                throw {
                    statusCode: 400,
                    code: "INVALID_DOCUMENT_TYPE",
                    message: `Document type must be one of: ${validTypes.join(", ")}`,
                };
            }

            // Check company existence and ownership
            const company = await Company.findOne({ _id: companyId, userId });
            if (!company) {
                throw {
                    statusCode: 404,
                    code: "COMPANY_NOT_FOUND",
                    message: "Company not found or you don't have permission to upload documents",
                };
            }

            // Upload document
            const uploadedDocs = await documentService.uploadDocuments(
                [file],
                userId,
                companyId,
                [documentType]
            );

            const uploadedDoc = uploadedDocs[0];

            // Update authorization letter if it's that type
            if (documentType === "AUTHORIZATION_LETTER") {
                if (!company.authorizedPerson) {
                    company.authorizedPerson = {};
                }
                company.authorizedPerson.authorizationLetter = uploadedDoc._id;
                await company.save();
            }

            logger.info(`Document uploaded to company: ${company.companyName}`, {
                companyId: company._id,
                documentType,
                documentId: uploadedDoc.documentId,
                userId,
            });

            return uploadedDoc;
        } catch (error) {
            throw error;
        }
    }


}

module.exports = new CompanyService();
