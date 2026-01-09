const NOCApplication = require("../../noc/noc-application.model");
const notificationService = require("../../notifications/notification.service");
const logger = require("../../utils/logger");

class SGWAService {
    /**
     * Get applications for SGWA review (DGO approved)
     */
    async getApplications(officerId, filters = {}) {
        try {
            const query = {
                status: { $in: ["APPROVED_DGO", "PENDING_SGWA_REVIEW", "UNDER_REVIEW_SGWA"] }
            };

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.blockCategory) {
                query["location.blockCategory"] = filters.blockCategory;
            }

            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const skip = (page - 1) * limit;

            const applications = await NOCApplication.find(query)
                .populate("userId", "firstName lastName email phone")
                .populate("companyId", "companyName contactPerson")
                .sort({ "approvalFlow.dgo.reviewedAt": 1 })
                .skip(skip)
                .limit(limit);

            const total = await NOCApplication.countDocuments(query);

            return {
                applications,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) }
            };
        } catch (error) {
            logger.error("Error fetching SGWA applications", error);
            throw error;
        }
    }

    /**
     * Approve application and forward to Enforcement
     */
    async approveApplication(applicationId, officerId, data) {
        try {
            const application = await NOCApplication.findOne({ applicationId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found"
                };
            }

            if (application.status !== "APPROVED_DGO") {
                throw {
                    statusCode: 400,
                    code: "INVALID_STATUS",
                    message: "Only DGO-approved applications can be reviewed by SGWA"
                };
            }

            // Update SGWA approval
            application.approvalFlow.sgwa = {
                reviewedBy: officerId,
                reviewedAt: new Date(),
                status: "APPROVED",
                remarks: data.remarks || "",
                recommendation: data.recommendation || "RECOMMEND_APPROVAL_WITH_CONDITIONS",
                technicalReview: data.technicalReview,
                proposedValidityYears: data.validityYears || 3,
                conditions: data.conditions || [],
                cessAmount: data.cessAmount || 0
            };

            application.status = "APPROVED_SGWA";

            // Auto-assign to Enforcement
            application.approvalFlow.enforcement.assignedAt = new Date();

            await application.save();

            // Send notifications
            await this.sendNotifications(application, "SGWA_APPROVED");

            logger.info(`Application ${applicationId} approved by SGWA`, { officerId });

            return application;
        } catch (error) {
            logger.error("Error approving application", error);
            throw error;
        }
    }

    /**
     * Reject application
     */
    async rejectApplication(applicationId, officerId, data) {
        try {
            const application = await NOCApplication.findOne({ applicationId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found"
                };
            }

            application.approvalFlow.sgwa = {
                reviewedBy: officerId,
                reviewedAt: new Date(),
                status: "REJECTED",
                remarks: data.remarks,
                recommendation: "REJECT"
            };

            application.status = "REJECTED_SGWA";
            await application.save();

            await this.sendNotifications(application, "SGWA_REJECTED");

            logger.info(`Application ${applicationId} rejected by SGWA`, { officerId });

            return application;
        } catch (error) {
            logger.error("Error rejecting application", error);
            throw error;
        }
    }

    /**
     * Raise query
     */
    async raiseQuery(applicationId, officerId, data) {
        try {
            const application = await NOCApplication.findOne({ applicationId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found"
                };
            }

            const ApplicationQuery = require("../../noc/application-query.model");
            const { v4: uuidv4 } = require("uuid");

            const query = new ApplicationQuery({
                queryId: uuidv4(),
                applicationId: application._id,
                raisedBy: officerId,
                raisedByRole: "SGWA",
                subject: data.subject,
                description: data.query,
                priority: data.priority || "MEDIUM",
                status: "OPEN",
                responseDeadline: data.responseDeadline
            });

            await query.save();

            application.status = "QUERY_RAISED_SGWA";
            application.approvalFlow.sgwa.status = "QUERY";
            application.approvalFlow.sgwa.remarks = data.query;
            await application.save();

            await this.sendNotifications(application, "SGWA_QUERY_RAISED");

            logger.info(`Query raised by SGWA for application ${applicationId}`, { officerId });

            return { application, query };
        } catch (error) {
            logger.error("Error raising query", error);
            throw error;
        }
    }

    /**
     * Get SGWA dashboard statistics
     */
    async getDashboardStats(officerId) {
        try {
            const [total, pending, underReview, approved, rejected] = await Promise.all([
                NOCApplication.countDocuments({ status: { $in: ["APPROVED_DGO", "PENDING_SGWA_REVIEW", "UNDER_REVIEW_SGWA", "QUERY_RAISED_SGWA"] } }),
                NOCApplication.countDocuments({ status: { $in: ["APPROVED_DGO", "PENDING_SGWA_REVIEW"] } }),
                NOCApplication.countDocuments({ status: "UNDER_REVIEW_SGWA" }),
                NOCApplication.countDocuments({ status: "APPROVED_SGWA" }),
                NOCApplication.countDocuments({ status: "REJECTED_SGWA" })
            ]);

            return { total, pending, underReview, approved, rejected };
        } catch (error) {
            logger.error("Error fetching SGWA stats", error);
            throw error;
        }
    }

    async sendNotifications(application, event) {
        try {
            await notificationService.createNotification(application.userId, {
                type: event,
                title: this.getNotificationTitle(event),
                message: this.getNotificationMessage(event, application),
                relatedId: application.applicationId,
                relatedType: "APPLICATION",
                priority: "HIGH"
            });
        } catch (error) {
            logger.error("Error sending notifications", error);
        }
    }

    getNotificationTitle(event) {
        const titles = {
            SGWA_APPROVED: "Application Approved by SGWA",
            SGWA_REJECTED: "Application Rejected by SGWA",
            SGWA_QUERY_RAISED: "SGWA Query Raised"
        };
        return titles[event] || "Application Update";
    }

    getNotificationMessage(event, application) {
        const messages = {
            SGWA_APPROVED: `Your NOC application ${application.applicationNumber} has been approved by SGWA and forwarded to Enforcement Wing for final approval.`,
            SGWA_REJECTED: `Your NOC application ${application.applicationNumber} has been rejected by SGWA. Check remarks for details.`,
            SGWA_QUERY_RAISED: `SGWA has raised a query on your application ${application.applicationNumber}. Please respond.`
        };
        return messages[event] || "Your application status has been updated.";
    }
}

module.exports = new SGWAService();
