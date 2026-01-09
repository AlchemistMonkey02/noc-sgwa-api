const NOCApplication = require("../../noc/noc-application.model");
const notificationService = require("../../notifications/notification.service");
const logger = require("../../utils/logger");

class DGOService {
    /**
     * Get applications for DGO review
     */
    async getApplications(officerId, filters = {}) {
        try {
            const query = {
                status: { $in: ["SUBMITTED", "PENDING_DGO_REVIEW", "UNDER_REVIEW_DGO"] }
            };

            // Filter by district if DGO is assigned to specific district
            if (filters.districtId) {
                query["location.districtId"] = filters.districtId;
            }

            if (filters.status) {
                query.status = filters.status;
            }

            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const skip = (page - 1) * limit;

            const applications = await NOCApplication.find(query)
                .populate("userId", "firstName lastName email phone")
                .populate("companyId", "companyName contactPerson")
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
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error("Error fetching DGO applications", error);
            throw error;
        }
    }

    /**
     * Approve application and forward to SGWA
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

            if (application.status !== "SUBMITTED" && application.status !== "QUERY_RESPONDED") {
                throw {
                    statusCode: 400,
                    code: "INVALID_STATUS",
                    message: "Application cannot be approved in current status"
                };
            }

            // Update approval flow
            application.approvalFlow.dgo = {
                reviewedBy: officerId,
                reviewedAt: new Date(),
                status: "APPROVED",
                remarks: data.remarks || "",
                recommendation: data.recommendation || "RECOMMEND_APPROVAL",
                documentsVerified: true
            };

            // Update status
            application.status = "APPROVED_DGO";

            // Auto-assign to SGWA (can be enhanced with queue logic)
            application.approvalFlow.sgwa.assignedAt = new Date();

            await application.save();

            // Send notifications
            await this.sendNotifications(application, "DGO_APPROVED");

            logger.info(`Application ${applicationId} approved by DGO`, { officerId });

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

            application.approvalFlow.dgo = {
                reviewedBy: officerId,
                reviewedAt: new Date(),
                status: "REJECTED",
                remarks: data.remarks,
                recommendation: "REJECT"
            };

            application.status = "REJECTED_DGO";
            await application.save();

            // Send notifications
            await this.sendNotifications(application, "DGO_REJECTED");

            logger.info(`Application ${applicationId} rejected by DGO`, { officerId });

            return application;
        } catch (error) {
            logger.error("Error rejecting application", error);
            throw error;
        }
    }

    /**
     * Raise query to applicant
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

            // Create query record
            const query = new ApplicationQuery({
                queryId: uuidv4(),
                applicationId: application._id,
                raisedBy: officerId,
                raisedByRole: "DGO",
                subject: data.subject,
                description: data.query,
                priority: data.priority || "MEDIUM",
                status: "OPEN",
                responseDeadline: data.responseDeadline
            });

            await query.save();

            // Update application status
            application.status = "QUERY_RAISED_DGO";
            application.approvalFlow.dgo.status = "QUERY";
            application.approvalFlow.dgo.remarks = data.query;
            await application.save();

            // Send notifications
            await this.sendNotifications(application, "DGO_QUERY_RAISED");

            logger.info(`Query raised for application ${applicationId}`, { officerId });

            return { application, query };
        } catch (error) {
            logger.error("Error raising query", error);
            throw error;
        }
    }

    /**
     * Get DGO dashboard statistics
     */
    async getDashboardStats(officerId, districtId) {
        try {
            const query = districtId ? { "location.districtId": districtId } : {};

            const [total, pending, underReview, approved, rejected] = await Promise.all([
                NOCApplication.countDocuments({ ...query, status: { $in: ["SUBMITTED", "PENDING_DGO_REVIEW", "UNDER_REVIEW_DGO", "QUERY_RAISED_DGO"] } }),
                NOCApplication.countDocuments({ ...query, status: { $in: ["SUBMITTED", "PENDING_DGO_REVIEW"] } }),
                NOCApplication.countDocuments({ ...query, status: "UNDER_REVIEW_DGO" }),
                NOCApplication.countDocuments({ ...query, status: "APPROVED_DGO" }),
                NOCApplication.countDocuments({ ...query, status: "REJECTED_DGO" })
            ]);

            return {
                total,
                pending,
                underReview,
                approved,
                rejected
            };
        } catch (error) {
            logger.error("Error fetching DGO stats", error);
            throw error;
        }
    }

    /**
     * Send multi-channel notifications
     */
    async sendNotifications(application, event) {
        try {
            // Create in-app notification
            await notificationService.createNotification(application.userId, {
                type: event,
                title: this.getNotificationTitle(event),
                message: this.getNotificationMessage(event, application),
                relatedId: application.applicationId,
                relatedType: "APPLICATION",
                priority: "HIGH"
            });

            // TODO: Send Email
            // TODO: Send SMS to user phone and company phone
            // TODO: Send WhatsApp

            logger.info(`Notifications sent for ${event}`, { applicationId: application.applicationId });
        } catch (error) {
            logger.error("Error sending notifications", error);
            // Don't throw - notifications are non-blocking
        }
    }

    getNotificationTitle(event) {
        const titles = {
            DGO_APPROVED: "Application Approved by DGO",
            DGO_REJECTED: "Application Rejected by DGO",
            DGO_QUERY_RAISED: "Query Raised on Your Application"
        };
        return titles[event] || "Application Update";
    }

    getNotificationMessage(event, application) {
        const messages = {
            DGO_APPROVED: `Your NOC application ${application.applicationNumber} has been approved by District Officer and forwarded to SGWA for technical review.`,
            DGO_REJECTED: `Your NOC application ${application.applicationNumber} has been rejected by District Officer. Please check the remarks.`,
            DGO_QUERY_RAISED: `District Officer has raised a query on your application ${application.applicationNumber}. Please respond within the deadline.`
        };
        return messages[event] || "Your application status has been updated.";
    }
}

module.exports = new DGOService();
