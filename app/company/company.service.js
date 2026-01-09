const Company = require("./company.model");
const User = require("../auth/user.model");
const logger = require("../utils/logger");

class CompanyService {
    /**
     * Register a new company
     */
    async registerCompany(userId, companyData) {
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

            // Create company
            const company = new Company({
                userId,
                ...companyData,
            });

            await company.save();

            logger.info(`New company registered: ${company.companyName}`, {
                companyId: company._id,
                userId,
            });

            return company;
        } catch (error) {
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
                .populate("approvedBy", "firstName lastName");

            if (!company) {
                throw {
                    statusCode: 404,
                    code: "COMPANY_NOT_FOUND",
                    message: "Company not found",
                };
            }

            return company;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update company details
     */
    async updateCompany(companyId, userId, updateData) {
        try {
            // Don't allow updating certain fields
            delete updateData.userId;
            delete updateData.verificationStatus;
            delete updateData.isApproved;
            delete updateData.approvedBy;
            delete updateData.approvedAt;

            const company = await Company.findOneAndUpdate(
                { _id: companyId, userId },
                { $set: updateData },
                { new: true, runValidators: true }
            );

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
}

module.exports = new CompanyService();
