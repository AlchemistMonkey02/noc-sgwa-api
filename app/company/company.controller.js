const companyService = require("./company.service");
const logger = require("../utils/logger");

class CompanyController {
    /**
     * POST /api/companies/register
     * Register a new company
     */
    async registerCompany(req, res, next) {
        try {
            const userId = req.user.id;
            const company = await companyService.registerCompany(userId, req.body, req.files);

            res.status(201).json({
                success: true,
                data: company,
                message: "Company registered successfully! Verification pending.",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/companies/types
     * Get valid company types
     */
    async getCompanyTypes(req, res, next) {
        try {
            const types = [
                "PRIVATE_LIMITED",
                "PUBLIC_LIMITED",
                "PARTNERSHIP",
                "PROPRIETORSHIP",
                "LLP",
                "GOVERNMENT",
                "NGO",
                "TRUST",
                "SOCIETY",
                "COOPERATIVE"
            ];

            res.status(200).json({
                success: true,
                data: types,
                message: "Company types fetched successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/companies
     * Get all companies for logged-in user
     */
    async getUserCompanies(req, res, next) {
        try {
            const userId = req.user.id;
            const filters = {
                status: req.query.status,
                verificationStatus: req.query.verificationStatus,
            };

            const companies = await companyService.getUserCompanies(userId, filters);

            res.status(200).json({
                success: true,
                data: {
                    companies,
                    count: companies.length,
                },
                message: "User companies retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/companies/stats
     * Get company statistics for user
     */
    async getCompanyStats(req, res, next) {
        try {
            const userId = req.user.id;
            const stats = await companyService.getCompanyStats(userId);

            res.status(200).json({
                success: true,
                data: stats,
                message: "Company statistics retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/companies/profile
     * Get company profile for logged-in user
     */
    async getCompanyProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const company = await companyService.getCompanyProfile(userId);

            res.status(200).json({
                success: true,
                data: company,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/companies/:id/documents
     * Get company documents
     */
    async getCompanyDocuments(req, res, next) {
        try {
            const companyId = req.params.id;
            const userId = req.user.id;

            // Allow officers to bypass ownership check
            const isOfficer = ["DGO", "SGWA", "ENFORCEMENT", "ADMIN"].includes(req.user.userType);

            const documents = await companyService.getCompanyDocuments(
                companyId,
                isOfficer ? null : userId
            );

            res.status(200).json({
                success: true,
                data: documents,
                message: "Company documents retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/companies/:id/documents/upload
     * Upload a single company document
     */
    async uploadCompanyDocument(req, res, next) {
        try {
            const companyId = req.params.id;
            const userId = req.user.id;
            const { documentType } = req.body;

            if (!documentType) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "MISSING_DOCUMENT_TYPE",
                        message: "documentType is required",
                    },
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "MISSING_FILE",
                        message: "No file uploaded",
                    },
                });
            }

            const document = await companyService.uploadCompanyDocument(
                companyId,
                userId,
                documentType,
                req.file
            );

            res.status(201).json({
                success: true,
                data: document,
                message: "Document uploaded successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/companies/:id
     * Get company by ID
     */
    async getCompanyById(req, res, next) {
        try {
            const userId = req.user.id;

            // Allow officers to view any company
            const isOfficer = ["DGO", "SGWA", "ENFORCEMENT", "ADMIN"].includes(req.user.userType);

            // If officer, pass null for userId to skip ownership check
            // If applicant, pass userId to enforce ownership
            const company = await companyService.getCompanyById(req.params.id, isOfficer ? null : userId);

            res.status(200).json({
                success: true,
                data: company,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/companies/:id
     * Update company details
     */
    async updateCompany(req, res, next) {
        try {
            const userId = req.user.id;
            const company = await companyService.updateCompany(
                req.params.id,
                userId,
                req.body,
                req.files
            );

            res.status(200).json({
                success: true,
                data: company,
                message: "Company updated successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/companies/:id
     * Delete company
     */
    async deleteCompany(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await companyService.deleteCompany(req.params.id, userId);

            res.status(200).json({
                success: true,
                data: null,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    // ========== Officer Endpoints ==========

    /**
     * GET /api/companies/officer/all
     * Get all companies (Officer view)
     */
    async getAllCompanies(req, res, next) {
        try {
            const filters = {
                verificationStatus: req.query.verificationStatus,
                status: req.query.status,
                companyType: req.query.companyType,
                search: req.query.search,
            };
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await companyService.getAllCompanies(filters, page, limit);

            res.status(200).json({
                success: true,
                data: result,
                message: "All companies retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/companies/officer/:id/verify
     * Verify/Reject company
     */
    async verifyCompany(req, res, next) {
        try {
            const officerId = req.user.id;
            const { action, reason } = req.body;

            if (!["approve", "reject"].includes(action)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_ACTION",
                        message: "Action must be 'approve' or 'reject'",
                    },
                });
            }

            const company = await companyService.verifyCompany(
                req.params.id,
                officerId,
                action,
                reason
            );

            res.status(200).json({
                success: true,
                data: company,
                message: `Company ${action}d successfully`,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/companies/officer/:id/verify-document
     * Verify/Reject company document
     */
    async verifyCompanyDocument(req, res, next) {
        try {
            const officerId = req.user.id;
            const { documentId, status, remarks } = req.body;

            if (!["VERIFIED", "REJECTED"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_STATUS",
                        message: "Status must be 'VERIFIED' or 'REJECTED'",
                    },
                });
            }

            const company = await companyService.verifyCompanyDocument(
                req.params.id,
                officerId,
                documentId,
                status,
                remarks
            );

            res.status(200).json({
                success: true,
                data: company,
                message: `Document ${status.toLowerCase()} successfully`,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CompanyController();
