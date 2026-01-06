const { v4: uuidv4 } = require("uuid");
const NOCApplication = require("./noc-application.model");
const ApplicationQuery = require("./application-query.model");
const NOCCertificate = require("./noc-certificate.model");
const logger = require("../utils/logger");

class OfficerService {
    /**
     * Get applications for officer review
     */
    async getAssignedApplications(officerId, filters = {}) {
        try {
            const query = {
                status: { $in: ["SUBMITTED", "UNDER_REVIEW", "QUERY_RESPONDED", "INSPECTED"] },
            };

            // Can filter by assigned applications or all pending
            if (filters.assignedOnly === "true") {
                query.assignedTo = officerId;
            }

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.district) {
                query["location.districtId"] = filters.district;
            }

            if (filters.blockCategory) {
                query["location.blockCategory"] = filters.blockCategory;
            }

            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const skip = (page - 1) * limit;

            const applications = await NOCApplication.find(query)
                .populate("userId", "firstName lastName email phone")
                .select("-documents")
                .sort({ submittedAt: 1 }) // Oldest first
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
            logger.error("Error fetching officer applications", error);
            throw error;
        }
    }

    /**
     * Assign application to officer
     */
    async assignApplication(applicationId, officerId) {
        try {
            const application = await NOCApplication.findOne({ applicationId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            if (application.status !== "SUBMITTED") {
                throw {
                    statusCode: 400,
                    code: "INVALID_STATUS",
                    message: "Only submitted applications can be assigned",
                };
            }

            application.assignedTo = officerId;
            application.assignedAt = new Date();
            application.status = "UNDER_REVIEW";
            await application.save();

            logger.info(`Application assigned: ${application.applicationNumber}`, { officerId });

            return application;
        } catch (error) {
            logger.error("Error assigning application", error);
            throw error;
        }
    }

    /**
     * Raise query on application
     */
    async raiseQuery(applicationId, query, officerId) {
        try {
            const application = await NOCApplication.findOne({ applicationId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            const applicationQuery = new ApplicationQuery({
                queryId: uuidv4(),
                applicationId: application._id,
                query,
                raisedBy: officerId,
                status: "OPEN",
            });

            await applicationQuery.save();

            // Update application status
            application.status = "QUERY_RAISED";
            await application.save();

            logger.info(`Query raised: ${applicationQuery.queryId}`, {
                applicationId,
                officerId,
            });

            return applicationQuery;
        } catch (error) {
            logger.error("Error raising query", error);
            throw error;
        }
    }

    /**
     * Approve application and generate NOC
     */
    async approveApplication(applicationId, approvalData, officerId) {
        try {
            const application = await NOCApplication.findOne({ applicationId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            if (!["UNDER_REVIEW", "INSPECTED"].includes(application.status)) {
                throw {
                    statusCode: 400,
                    code: "INVALID_STATUS",
                    message: "Application cannot be approved in current status",
                };
            }

            // Create NOC Certificate
            const certificate = new NOCCertificate({
                nocId: uuidv4(),
                applicationId: application._id,
                userId: application.userId,
                issueDate: new Date(),
                validFrom: new Date(),
                validUpto: new Date(
                    Date.now() + approvalData.validityYears * 365 * 24 * 60 * 60 * 1000
                ),
                validityYears: approvalData.validityYears,
                approvedWaterQuantity: approvalData.approvedWaterQuantity,
                conditions: approvalData.conditions || [],
                restrictions: approvalData.restrictions || [],
                approvedBy: officerId,
                status: "ACTIVE",
            });

            await certificate.save(); // Auto-generates nocNumber

            // Update application
            application.status = "APPROVED";
            application.approvedAt = new Date();
            application.nocCertificateId = certificate._id;
            await application.save();

            logger.info(`Application approved: ${application.applicationNumber}`, {
                nocNumber: certificate.nocNumber,
                officerId,
            });

            // TODO: Generate PDF certificate
            // TODO: Send approval email

            return { application, certificate };
        } catch (error) {
            logger.error("Error approving application", error);
            throw error;
        }
    }

    /**
     * Reject application
     */
    async rejectApplication(applicationId, rejectionReason, officerId) {
        try {
            const application = await NOCApplication.findOne({ applicationId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            if (!["UNDER_REVIEW", "INSPECTED"].includes(application.status)) {
                throw {
                    statusCode: 400,
                    code: "INVALID_STATUS",
                    message: "Application cannot be rejected in current status",
                };
            }

            application.status = "REJECTED";
            application.rejectedAt = new Date();
            application.rejectionReason = rejectionReason;
            await application.save();

            logger.info(`Application rejected: ${application.applicationNumber}`, { officerId });

            // TODO: Send rejection email

            return application;
        } catch (error) {
            logger.error("Error rejecting application", error);
            throw error;
        }
    }
}

module.exports = new OfficerService();
