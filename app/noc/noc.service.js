const { v4: uuidv4 } = require("uuid");
const NOCApplication = require("./noc-application.model");
const ApplicationQuery = require("./application-query.model");
const NOCCertificate = require("./noc-certificate.model");
const Payment = require("./payment.model");
const Block = require("../master-data/block.model");
const FeeStructure = require("../master-data/fee-structure.model");
const emailService = require("../utils/email.service");
const logger = require("../utils/logger");

class NOCService {
    /**
     * Create or update draft application
     */
    async createOrUpdateApplication(data, userId) {
        try {
            const applicationId = data.applicationId || uuidv4();

            // Get block category
            const block = await Block.findOne({
                blockId: data.location.blockId,
                districtId: data.location.districtId,
            });

            if (!block) {
                throw {
                    statusCode: 404,
                    code: "BLOCK_NOT_FOUND",
                    message: "Invalid block or district",
                };
            }

            const applicationData = {
                ...data,
                applicationId,
                userId,
                location: {
                    ...data.location,
                    blockCategory: block.category,
                },
                status: "DRAFT",
            };

            const application = await NOCApplication.findOneAndUpdate(
                { applicationId, userId },
                { $set: applicationData },
                { new: true, upsert: true, runValidators: true }
            );

            logger.info(`Application ${data.applicationId ? "updated" : "created"}: ${applicationId}`, {
                userId,
            });

            return application;
        } catch (error) {
            logger.error("Error creating/updating application", error);
            throw error;
        }
    }

    /**
     * Submit application for review
     */
    async submitApplication(applicationId, userId) {
        try {
            const application = await NOCApplication.findOne({ applicationId, userId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            if (application.status !== "DRAFT") {
                throw {
                    statusCode: 400,
                    code: "INVALID_STATUS",
                    message: "Only draft applications can be submitted",
                };
            }

            // Calculate fees
            const feeStructure = await FeeStructure.findOne({
                applicationType: application.applicationType,
                blockCategory: application.location.blockCategory,
                isActive: true,
            }).sort({ effectiveFrom: -1 });

            if (!feeStructure) {
                throw {
                    statusCode: 404,
                    code: "FEE_STRUCTURE_NOT_FOUND",
                    message: "Fee structure not found for this application type and block category",
                };
            }

            const ecCharges =
                feeStructure.ecChargesPerMLD * application.waterRequirement.dailyRequirement;
            const totalAmount = feeStructure.calculateTotalFee(
                application.waterRequirement.dailyRequirement
            );

            application.feeDetails = {
                baseAmount: feeStructure.baseAmount,
                ecCharges,
                waterBudgetCharges: feeStructure.waterBudgetCharges,
                processingFee: feeStructure.processingFee,
                inspectionFee: feeStructure.inspectionFee,
                totalAmount,
                isPaid: false,
            };

            application.status = "SUBMITTED";
            application.submittedAt = new Date();
            await application.save(); // This will trigger auto-generation of application number

            logger.info(`Application submitted: ${application.applicationNumber}`, { userId });

            // Send email notification (async)
            const user = await require("../auth/user.model").findById(userId);
            if (user) {
                emailService
                    .sendApplicationSubmitted(user, {
                        applicationNumber: application.applicationNumber,
                        applicationType: application.applicationType,
                        projectDetails: application.projectDetails,
                        submittedDate: application.submittedAt,
                        applicationId: application.applicationId,
                    })
                    .catch((err) => logger.error("Failed to send application submitted email", err));
            }

            return application;
        } catch (error) {
            logger.error("Error submitting application", error);
            throw error;
        }
    }

    /**
     * Get user's applications
     */
    async getUserApplications(userId, filters = {}) {
        try {
            const query = { userId };

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.applicationType) {
                query.applicationType = filters.applicationType;
            }

            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const skip = (page - 1) * limit;

            const applications = await NOCApplication.find(query)
                .select("-documents")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await NOCApplication.countDocuments(query);

            return {
                applications,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error("Error fetching user applications", error);
            throw error;
        }
    }

    /**
     * Get application by ID
     */
    async getApplicationById(applicationId, userId, userType) {
        try {
            const application = await NOCApplication.findOne({ applicationId }).populate(
                "nocCertificateId"
            );

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            // Access control
            const isOwner = application.userId.toString() === userId;
            const isOfficer = ["DGO", "RSGWA", "ENFORCEMENT"].includes(userType);

            if (!isOwner && !isOfficer) {
                throw {
                    statusCode: 403,
                    code: "UNAUTHORIZED_ACCESS",
                    message: "You do not have permission to view this application",
                };
            }

            return application;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Withdraw application
     */
    async withdrawApplication(applicationId, userId) {
        try {
            const application = await NOCApplication.findOne({ applicationId, userId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            if (["APPROVED", "REJECTED", "NOC_ISSUED", "WITHDRAWN"].includes(application.status)) {
                throw {
                    statusCode: 400,
                    code: "CANNOT_WITHDRAW",
                    message: "Application cannot be withdrawn in current status",
                };
            }

            application.status = "WITHDRAWN";
            await application.save();

            logger.info(`Application withdrawn: ${application.applicationNumber}`, { userId });

            return application;
        } catch (error) {
            logger.error("Error withdrawing application", error);
            throw error;
        }
    }

    /**
     * Get application queries
     */
    async getApplicationQueries(applicationId) {
        try {
            const queries = await ApplicationQuery.find({ applicationId })
                .populate("raisedBy", "firstName lastName")
                .populate("respondedBy", "firstName lastName")
                .sort({ raisedAt: -1 });

            return queries;
        } catch (error) {
            logger.error("Error fetching application queries", error);
            throw error;
        }
    }

    /**
     * Respond to query
     */
    async respondToQuery(queryId, response, userId) {
        try {
            const query = await ApplicationQuery.findOne({ queryId });

            if (!query) {
                throw {
                    statusCode: 404,
                    code: "QUERY_NOT_FOUND",
                    message: "Query not found",
                };
            }

            if (query.status !== "OPEN") {
                throw {
                    statusCode: 400,
                    code: "QUERY_ALREADY_RESPONDED",
                    message: "Query has already been responded to",
                };
            }

            query.response = response;
            query.respondedBy = userId;
            query.respondedAt = new Date();
            query.status = "RESPONDED";
            await query.save();

            // Update application status
            const application = await NOCApplication.findById(query.applicationId);
            if (application && application.status === "QUERY_RAISED") {
                application.status = "QUERY_RESPONDED";
                await application.save();
            }

            logger.info(`Query responded: ${queryId}`, { userId });

            return query;
        } catch (error) {
            logger.error("Error responding to query", error);
            throw error;
        }
    }

    /**
     * Track application (public)
     */
    async trackApplication(applicationNumber) {
        try {
            const application = await NOCApplication.findOne({ applicationNumber }).select(
                "applicationNumber applicationType status submittedAt location.districtId projectDetails.projectName"
            );

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            return application;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new NOCService();
