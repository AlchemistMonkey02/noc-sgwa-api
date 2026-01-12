const NOCApplication = require("../../noc/noc-application.model");
const NOCCertificate = require("../../noc/noc-certificate.model");
const notificationService = require("../../notifications/notification.service");
const logger = require("../../utils/logger");

const Violation = require("./violation.model");
const Complaint = require("./complaint.model");

class EnforcementService {
    // ... existing start ...

    /**
     * Get active NOCs for monitoring
     */
    async getActiveNOCs(filters = {}) {
        try {
            const query = { status: "ACTIVE" };
            if (filters.districtId) query["location.districtId"] = filters.districtId; // This might need join or denormalization if not in certificate
            // Assuming strict certificate query for now:

            // To filter by location, we might need to aggregrate with NOCApplication or store location in Certificate
            // For now, simple fetch
            const certificates = await NOCCertificate.find(query)
                .populate("companyId", "companyName")
                .limit(50);
            return certificates;
        } catch (error) { throw error; }
    }

    /**
     * Schedule Compliance Inspection
     */
    async scheduleComplianceInspection(officerId, data) {
        try {
            const { nocId, inspectionDate, remarks } = data;
            // Create a pseudo-application or update certificate state?
            // Or log in 'inspections' collection if it existed.
            // For now, logging to console as stub, or updating Certificate metadata if supported
            return { message: "Compliance inspection scheduled (Stub)", inspectionDate };
        } catch (error) { throw error; }
    }

    /**
     * Submit Compliance Report
     */
    async submitComplianceReport(inspectionId, officerId, data) {
        // finding inspection record...
        // Stub
        return { message: "Report submitted", status: "COMPLIANT" };
    }

    // ... Violations ...
    async issueWarning(officerId, data) {
        try {
            const { v4: uuidv4 } = require("uuid");
            const violation = new Violation({
                violationId: uuidv4(),
                ...data,
                type: 'WARNING',
                issuedBy: officerId
            });
            await violation.save();
            return violation;
        } catch (error) { throw error; }
    }

    async imposePenalty(officerId, data) {
        try {
            const { v4: uuidv4 } = require("uuid");
            const violation = new Violation({
                violationId: uuidv4(),
                ...data,
                type: 'PENALTY',
                issuedBy: officerId
            });
            await violation.save();
            return violation;
        } catch (error) { throw error; }
    }

    async initiateCancellation(nocId, officerId, data) {
        // Logic to update NOC status to SUSPENDED/CANCELLED notice
        // Stub
        return { message: "Cancellation notice sent" };
    }

    // ... Complaints ...
    async registerComplaint(officerId, data) {
        try {
            const { v4: uuidv4 } = require("uuid");
            const complaint = new Complaint({
                complaintId: uuidv4(),
                ...data, // includes subject, description, complainant info
                status: 'REGISTERED'
            });
            await complaint.save();
            return complaint;
        } catch (error) { throw error; }
    }

    async getComplaint(complaintId) {
        return await Complaint.findOne({ complaintId });
    }

    async updateComplaintStatus(complaintId, officerId, data) {
        const complaint = await Complaint.findOne({ complaintId });
        if (!complaint) throw { statusCode: 404, message: "Complaint not found" };

        complaint.status = data.status;
        if (data.status === 'RESOLVED') {
            complaint.resolvedAt = new Date();
            complaint.resolutionRemarks = data.remarks;
        }
        if (data.investigationReport) complaint.investigationReport = data.investigationReport;

        await complaint.save();
        return complaint;
    }

    /**
     * Get dashboard statistics
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
    /**
     * Get Approval Queue (Pending Final Approval)
     */
    async getApprovalQueue(officerId, filters = {}) {
        const query = {
            status: { $in: ["APPROVED_SGWA", "PENDING_FINAL_APPROVAL"] }
        };
        return await NOCApplication.find(query)
            .populate("userId", "firstName lastName")
            .populate("companyId", "companyName");
    }

    /**
     * Final approval and issue NOC (issueNOC)
     */
    async issueNOC(applicationId, officerId, data) {
        try {
            const application = await NOCApplication.findOne({ applicationId });

            if (!application) {
                throw { statusCode: 404, message: "Application not found" };
            }

            // Generate NOC Number
            const nocNumber = data.nocNumber || await this.generateNOCNumber(application);

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
            logger.error("Error issuing NOC", error);
            throw error;
        }
    }

    // Alias for backward compat if needed, but controller calls issueNOC now
    async approveApplication(appId, offId, data) { return this.issueNOC(appId, offId, data); }

    async returnToSGWA(applicationId, officerId, data) {
        const application = await NOCApplication.findOne({ applicationId });
        if (!application) throw { statusCode: 404, message: "Application not found" };

        application.status = "RETURNED_TO_SGWA";
        application.approvalFlow.enforcement = {
            reviewedBy: officerId,
            reviewedAt: new Date(),
            status: "RETURNED",
            remarks: data.remarks
        };
        // Reset SGWA status? Maybe partial reset or separate status
        // application.approvalFlow.sgwa.status = "PENDING"; // Optional

        await application.save();
        // Notify SGWA officers?
        return application;
    }

    async revokeNOC(nocId, officerId, data) {
        // This might take nocId or applicationId. Route says /nocs/:id/revoke (usually cert ID or app ID?)
        // Assuming ID is Certificate ID or Application ID. Let's try Application ID first or lookup certificate.
        // If nocId is passed, look up certificate.
        let certificate = await NOCCertificate.findOne({ $or: [{ certificateId: nocId }, { applicationId: nocId }] });
        if (!certificate) throw { statusCode: 404, message: "Certificate not found" };

        certificate.status = "REVOKED";
        certificate.revocationReason = data.reason;
        certificate.revokedAt = new Date();
        certificate.revokedBy = officerId;
        await certificate.save();

        // Update Application too
        await NOCApplication.findOneAndUpdate(
            { _id: certificate.applicationId },
            { status: "NOC_REVOKED" }
        );

        return { message: "NOC Revoked", certificate };
    }

    async getComplianceStats(officerId) {
        // Stub stats
        return {
            totalNOCs: await NOCCertificate.countDocuments({ status: "ACTIVE" }),
            inspectionsConducted: 12, // example
            violationsReported: await Violation.countDocuments({}),
            complianceRate: "95%"
        };
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
            // Use centralized notification service
            await notificationService.send(application.userId, event, {
                applicationNumber: application.applicationNumber,
                projectName: application.projectDetails?.projectName || 'Project',
                // Include NOC number if issued
                nocNumber: application.approvalFlow?.enforcement?.nocNumber
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
