const sgwaService = require("./sgwa.service");

class SGWAController {
    async getApplications(req, res, next) {
        try {
            const result = await sgwaService.getApplications(req.user.id, req.query);

            res.status(200).json({
                success: true,
                data: result.applications,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async getApplicationById(req, res, next) {
        try {
            const result = await sgwaService.getApplicationById(req.params.id);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async approveApplication(req, res, next) {
        try {
            const application = await sgwaService.approveApplication(
                req.params.id,
                req.user.id,
                req.body
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Application approved and forwarded to Enforcement Wing"
            });
        } catch (error) {
            next(error);
        }
    }

    async rejectApplication(req, res, next) {
        try {
            const application = await sgwaService.rejectApplication(
                req.params.id,
                req.user.id,
                req.body
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Application rejected"
            });
        } catch (error) {
            next(error);
        }
    }

    async raiseQuery(req, res, next) {
        try {
            const result = await sgwaService.raiseQuery(
                req.params.id,
                req.user.id,
                req.body
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Query raised successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    async getDashboardStats(req, res, next) {
        try {
            const stats = await sgwaService.getDashboardStats(req.user.id);

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }
    async assignApplication(req, res, next) {
        try {
            const result = await sgwaService.assignApplication(
                req.params.id,
                req.user.id, // Current officer (assigner)
                req.body // includes officerId (assignee)
            );
            res.json({ success: true, message: "Application assigned successfully" });
        } catch (err) { next(err); }
    }

    async generateReports(req, res, next) {
        try {
            // For now return dummy URL or data
            // In real world, this would generate PDF/Excel
            res.json({
                success: true,
                data: { downloadUrl: "/api/reports/dummy-report.pdf" },
                message: "Report generated successfully"
            });
        } catch (err) { next(err); }
    }

    async getMetrics(req, res, next) {
        try {
            // Stub implementation for metrics
            res.json({
                success: true,
                data: {
                    period: req.query.period || "monthly",
                    metrics: {
                        totalApplicationsReceived: 100,
                        totalApproved: 80,
                        totalRejected: 10,
                        averageProcessingTime: "14 days"
                    }
                }
            });
        } catch (err) { next(err); }
    }

    async exportData(req, res, next) {
        try {
            res.json({
                success: true,
                message: "Data export initiated",
                data: { downloadUrl: "/api/exports/data.xlsx" }
            });
        } catch (err) { next(err); }
    }

    async getNotifications(req, res, next) {
        try {
            // Stub
            res.json({
                success: true,
                data: {
                    notifications: [],
                    unreadCount: 0
                }
            });
        } catch (err) { next(err); }
    }

    async uploadDocument(req, res, next) {
        try {
            if (!req.file) {
                throw { statusCode: 400, message: "No file uploaded" };
            }

            const { documentType, relatedTo, description } = req.body;
            const documentService = require("../../documents/document.service");

            // Upload using existing service
            const uploadedDocs = await documentService.uploadDocuments(
                [req.file],
                req.user.id,
                null, // No company ID for officer
                documentType || "OFFICER_UPLOAD",
                {
                    applicationId: relatedTo,
                    description: description
                }
            );

            const doc = uploadedDocs[0];

            res.status(200).json({
                success: true,
                data: {
                    documentId: doc.documentId,
                    fileName: doc.fileName,
                    fileSize: doc.fileSize,
                    uploadedBy: req.user.firstName, // Assuming user populated
                    uploadedOn: doc.uploadedAt,
                    downloadUrl: `/api/officer/sgwa/documents/${doc.documentId}/download`
                }
            });
        } catch (err) { next(err); }
    }
    async getQueries(req, res, next) {
        try {
            const result = await sgwaService.getQueries(req.user.id, req.query);
            res.json({ success: true, data: result });
        } catch (err) { next(err); }
    }

    async viewQuery(req, res, next) {
        try {
            const result = await sgwaService.viewQuery(req.params.queryId);
            res.json({ success: true, data: result });
        } catch (err) { next(err); }
    }

    async acceptQuery(req, res, next) {
        try {
            const result = await sgwaService.acceptQuery(req.params.queryId, req.user.id, req.body);
            res.json({ success: true, message: result.message });
        } catch (err) { next(err); }
    }

    async rejectQuery(req, res, next) {
        try {
            const result = await sgwaService.rejectQuery(req.params.queryId, req.user.id, req.body);
            res.json({ success: true, message: result.message });
        } catch (err) { next(err); }
    }

    async addInternalNote(req, res, next) {
        try {
            const result = await sgwaService.addInternalNote(req.params.id, req.user.id, req.body);
            res.json({ success: true, message: result.message });
        } catch (err) { next(err); }
    }

    async markNotificationRead(req, res, next) {
        try {
            // Calling common notification service for this
            // Assuming notificationService has markAsRead
            const notificationService = require("../../notifications/notification.service");
            await notificationService.markAsRead(req.params.id);
            res.json({ success: true, message: "Notification marked as read" });
        } catch (err) { next(err); }
    }

    async downloadDocument(req, res, next) {
        try {
            const documentService = require("../../documents/document.service");
            const document = await documentService.getDocument(req.params.id, req.user.id, req.user.userType);

            res.download(document.filePath, document.originalFilename);
        } catch (err) { next(err); }
    }

    async viewDocument(req, res, next) {
        try {
            const documentService = require("../../documents/document.service");
            const document = await documentService.getDocument(req.params.id, req.user.id, req.user.userType);

            res.sendFile(require('path').resolve(document.filePath));
        } catch (err) { next(err); }
    }
}

module.exports = new SGWAController();
