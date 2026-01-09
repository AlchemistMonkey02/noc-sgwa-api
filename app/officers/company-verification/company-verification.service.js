const Company = require("../../company/company.model");
const notificationService = require("../../notifications/notification.service");
const logger = require("../../utils/logger");

class CompanyVerificationService {
    /**
     * Get companies pending verification
     */
    async getPendingCompanies(officerId, filters = {}) {
        try {
            const query = {
                verificationStatus: { $in: ["PENDING", "UNDER_REVIEW"] }
            };

            if (filters.verificationStatus) {
                query.verificationStatus = filters.verificationStatus;
            }

            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const skip = (page - 1) * limit;

            const companies = await Company.find(query)
                .populate("userId", "firstName lastName email phone")
                .sort({ createdAt: 1 }) // Oldest first
                .skip(skip)
                .limit(limit);

            const total = await Company.countDocuments(query);

            return {
                companies,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error("Error fetching pending companies", error);
            throw error;
        }
    }

    /**
     * Get company details for verification
     */
    async getCompanyDetails(companyId) {
        try {
            const company = await Company.findById(companyId)
                .populate("userId", "firstName lastName email phone")
                .populate("documents.documentId");

            if (!company) {
                throw {
                    statusCode: 404,
                    code: "COMPANY_NOT_FOUND",
                    message: "Company not found"
                };
            }

            return company;
        } catch (error) {
            logger.error("Error fetching company details", error);
            throw error;
        }
    }

    /**
     * Verify company and approve documents
     */
    async verifyCompany(companyId, officerId, data) {
        try {
            const company = await Company.findById(companyId).populate("userId");

            if (!company) {
                throw {
                    statusCode: 404,
                    code: "COMPANY_NOT_FOUND",
                    message: "Company not found"
                };
            }

            if (company.verificationStatus === "VERIFIED") {
                throw {
                    statusCode: 400,
                    code: "ALREADY_VERIFIED",
                    message: "Company is already verified"
                };
            }

            // Update company verification
            company.verificationStatus = "VERIFIED";
            company.verifiedBy = officerId;
            company.verifiedAt = new Date();
            company.verificationRemarks = data.remarks || "Documents verified successfully";
            company.isApproved = true;
            company.approvedBy = officerId;
            company.approvedAt = new Date();

            // Update document verifications
            if (data.documentVerifications && data.documentVerifications.length > 0) {
                company.documentVerifications = data.documentVerifications.map(doc => ({
                    documentType: doc.documentType,
                    documentId: doc.documentId,
                    status: doc.status || "APPROVED",
                    remarks: doc.remarks,
                    verifiedBy: officerId,
                    verifiedAt: new Date()
                }));
            }

            await company.save();

            // Send notifications
            await this.sendVerificationNotification(company, "COMPANY_VERIFIED");

            logger.info(`Company ${companyId} verified by officer ${officerId}`);

            return company;
        } catch (error) {
            logger.error("Error verifying company", error);
            throw error;
        }
    }

    /**
     * Reject company verification
     */
    async rejectCompany(companyId, officerId, data) {
        try {
            const company = await Company.findById(companyId).populate("userId");

            if (!company) {
                throw {
                    statusCode: 404,
                    code: "COMPANY_NOT_FOUND",
                    message: "Company not found"
                };
            }

            company.verificationStatus = "REJECTED";
            company.verifiedBy = officerId;
            company.verifiedAt = new Date();
            company.verificationRemarks = data.remarks;
            company.rejectionReason = data.rejectionReason || data.remarks;
            company.isApproved = false;

            // Update document verifications
            if (data.documentVerifications && data.documentVerifications.length > 0) {
                company.documentVerifications = data.documentVerifications.map(doc => ({
                    documentType: doc.documentType,
                    documentId: doc.documentId,
                    status: doc.status || "REJECTED",
                    remarks: doc.remarks,
                    verifiedBy: officerId,
                    verifiedAt: new Date()
                }));
            }

            await company.save();

            // Send notifications
            await this.sendVerificationNotification(company, "COMPANY_REJECTED");

            logger.info(`Company ${companyId} rejected by officer ${officerId}`);

            return company;
        } catch (error) {
            logger.error("Error rejecting company", error);
            throw error;
        }
    }

    /**
     * Get verification statistics
     */
    async getVerificationStats() {
        try {
            const [total, pending, underReview, verified, rejected] = await Promise.all([
                Company.countDocuments(),
                Company.countDocuments({ verificationStatus: "PENDING" }),
                Company.countDocuments({ verificationStatus: "UNDER_REVIEW" }),
                Company.countDocuments({ verificationStatus: "VERIFIED" }),
                Company.countDocuments({ verificationStatus: "REJECTED" })
            ]);

            return {
                total,
                pending,
                underReview,
                verified,
                rejected
            };
        } catch (error) {
            logger.error("Error fetching verification stats", error);
            throw error;
        }
    }

    /**
     * Send verification notification
     */
    async sendVerificationNotification(company, event) {
        try {
            const user = company.userId;

            // In-app notification
            await notificationService.createNotification(user._id, {
                type: event,
                title: event === "COMPANY_VERIFIED" ? "Company Verified" : "Company Verification Rejected",
                message: event === "COMPANY_VERIFIED"
                    ? `Your company ${company.companyName} has been verified. You can now submit NOC applications.`
                    : `Your company ${company.companyName} verification was rejected. Reason: ${company.verificationRemarks}`,
                relatedId: company._id.toString(),
                relatedType: "COMPANY",
                priority: "HIGH"
            });

            // TODO: Send Email, SMS, WhatsApp
            // Will be integrated with the multi-channel notification service

            logger.info(`Verification notifications sent for company ${company._id}`, { event });
        } catch (error) {
            logger.error("Error sending verification notification", error);
            // Don't throw - notifications are non-blocking
        }
    }
}

module.exports = new CompanyVerificationService();
