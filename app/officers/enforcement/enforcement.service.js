const NOCApplication = require("../../noc/noc-application.model");
const NOCCertificate = require("../../noc/noc-certificate.model");
const notificationService = require("../../notifications/notification.service");
const logger = require("../../utils/logger");

class EnforcementService {
    /**
     * Get applications for Enforcement review (SGWA approved)
     */
    async getApplications(officerId, filters = {}) {
        try {
            const query = {
                status: { $in: ["APPROVED_SGWA", "PENDING_ENFORCEMENT_REVIEW", "INSPECTION_SCHEDULED", "INSPECTED", "UNDER_REVIEW_ENFORCEMENT"] }
            };

            if (filters.status) {
                query.status = filters.status;
            }

            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const skip = (page - 1) * limit;

            const applications = await NOCApplication.find(query)
                .populate("userId", "firstName lastName email phone")
                .populate("companyId", "companyName contactPerson")
                .sort({ "approvalFlow.sgwa.reviewedAt": 1 })
                .skip(skip)
                .limit(limit);

            const total = await NOCApplication.countDocuments(query);

            return {
                applications,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) }
            };
        } catch (error) {
            logger.error("Error fetching Enforcement applications", error);
            throw error;
        }
    }

    /**
     * Schedule inspection
     */
    async scheduleInspection(applicationId, officerId, data) {
        try {
            const application = await NOCApplication.findOne({ applicationId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found"
                };
            }

            application.status = "INSPECTION_SCHEDULED";
            application.approvalFlow.enforcement.inspectionScheduledAt = data.inspectionDate;
            await application.save();

            await this.sendNotifications(application, "INSPECTION_SCHEDULED");

            logger.info(`Inspection scheduled for application ${applicationId}`, { officerId });

            return application;
        } catch (error) {
            logger.error("Error scheduling inspection", error);
            throw error;
        }
    }

    /**
     * Final approval and issue NOC
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

            // Generate NOC Number
            const nocNumber = await this.generateNOCNumber(application);

            // Update Enforcement approval
            application.approvalFlow.enforcement = {
                reviewedBy: officerId,
                reviewedAt: new Date(),
                status: "APPROVED",
                remarks: data.remarks || "",
                finalDecision: "APPROVED",
                nocNumber,
                nocIssuedAt: new Date()
            };

            application.status = "NOC_ISSUED";

            // Generate NOC Certificate
            const certificate = await this.generateNOCCertificate(application, nocNumber, data);

            await application.save();

            await this.sendNotifications(application, "NOC_ISSUED");

            logger.info(`NOC issued for application ${applicationId}`, { officerId, nocNumber });

            return { application, certificate };
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

            application.approvalFlow.enforcement = {
                reviewedBy: officerId,
                reviewedAt: new Date(),
                status: "REJECTED",
                remarks: data.remarks,
                finalDecision: "REJECTED"
            };

            application.status = "REJECTED_ENFORCEMENT";
            await application.save();

            await this.sendNotifications(application, "ENFORCEMENT_REJECTED");

            logger.info(`Application ${applicationId} rejected by Enforcement`, { officerId });

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
                raisedByRole: "ENFORCEMENT",
                subject: data.subject,
                description: data.query,
                priority: data.priority || "MEDIUM",
                status: "OPEN",
                responseDeadline: data.responseDeadline
            });

            await query.save();

            application.status = "QUERY_RAISED_ENFORCEMENT";
            application.approvalFlow.enforcement.status = "QUERY";
            application.approvalFlow.enforcement.remarks = data.query;
            await application.save();

            await this.sendNotifications(application, "ENFORCEMENT_QUERY_RAISED");

            logger.info(`Query raised by Enforcement for application ${applicationId}`, { officerId });

            return { application, query };
        } catch (error) {
            logger.error("Error raising query", error);
            throw error;
        }
    }

    /**
     * Generate NOC Number
     */
    async generateNOCNumber(application) {
        const year = new Date().getFullYear();
        const count = await NOCApplication.countDocuments({ status: "NOC_ISSUED" });
        const sequence = String(count + 1).padStart(6, '0');
        return `RJ/CGWA/NOC/${year}/${sequence}`;
    }

    /**
     * Generate NOC Certificate
     */
    async generateNOCCertificate(application, nocNumber, data) {
        try {
            const { v4: uuidv4 } = require("uuid");

            const certificate = new NOCCertificate({
                certificateId: uuidv4(),
                nocNumber,
                applicationId: application._id,
                userId: application.userId,
                companyId: application.companyId,
                validFrom: data.validFrom || new Date(),
                validUpto: data.validUpto,
                maxDailyExtraction: data.maxDailyExtraction,
                maxAnnualExtraction: data.maxAnnualExtraction,
                conditions: data.conditions || [],
                issuedBy: data.approvedBy,
                status: "ACTIVE"
            });

            await certificate.save();

            return certificate;
        } catch (error) {
            logger.error("Error generating NOC certificate", error);
            throw error;
        }
    }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats(officerId) {
        try {
            const [total, pending, inspectionScheduled, inspected, approved, rejected] = await Promise.all([
                NOCApplication.countDocuments({ status: { $in: ["APPROVED_SGWA", "PENDING_ENFORCEMENT_REVIEW", "INSPECTION_SCHEDULED", "INSPECTED", "UNDER_REVIEW_ENFORCEMENT"] } }),
                NOCApplication.countDocuments({ status: { $in: ["APPROVED_SGWA", "PENDING_ENFORCEMENT_REVIEW"] } }),
                NOCApplication.countDocuments({ status: "INSPECTION_SCHEDULED" }),
                NOCApplication.countDocuments({ status: "INSPECTED" }),
                NOCApplication.countDocuments({ status: "NOC_ISSUED" }),
                NOCApplication.countDocuments({ status: "REJECTED_ENFORCEMENT" })
            ]);

            return { total, pending, inspectionScheduled, inspected, approved, rejected };
        } catch (error) {
            logger.error("Error fetching Enforcement stats", error);
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
                priority: "CRITICAL"
            });
        } catch (error) {
            logger.error("Error sending notifications", error);
        }
    }

    getNotificationTitle(event) {
        const titles = {
            INSPECTION_SCHEDULED: "Site Inspection Scheduled",
            NOC_ISSUED: "NOC Certificate Issued",
            ENFORCEMENT_REJECTED: "Application Rejected",
            ENFORCEMENT_QUERY_RAISED: "Enforcement Query Raised"
        };
        return titles[event] || "Application Update";
    }

    getNotificationMessage(event, application) {
        const messages = {
            INSPECTION_SCHEDULED: `Site inspection has been scheduled for your NOC application ${application.applicationNumber}.`,
            NOC_ISSUED: `Congratulations! Your NOC has been issued with number ${application.approvalFlow.enforcement.nocNumber}. Download your certificate from the dashboard.`,
            ENFORCEMENT_REJECTED: `Your NOC application ${application.applicationNumber} has been rejected. Check remarks for details.`,
            ENFORCEMENT_QUERY_RAISED: `Enforcement Wing has raised a query on your application ${application.applicationNumber}. Please respond.`
        };
        return messages[event] || "Your application status has been updated.";
    }
}

module.exports = new EnforcementService();
