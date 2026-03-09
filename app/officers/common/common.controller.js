const User = require("../../auth/user.model");
const Notification = require("../../notifications/notification.model");
const NOCApplication = require("../../noc/noc-application.model");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Ensure bcryptjs is installed
const logger = require("../../utils/logger");

class CommonOfficerController {

    // Profile
    async getProfile(req, res, next) {
        try {
            const user = await User.findById(req.user.id).select("-password");
            if (!user) return res.status(404).json({ success: false, message: "User not found" });
            res.status(200).json({
                success: true,
                data: user,
                message: "Profile retrieved successfully"
            });
        } catch (err) { next(err); }
    }

    async updateProfile(req, res, next) {
        try {
            const { name, contactNumber, email } = req.body;
            // Split name if needed or update fields directly
            const updateData = {};
            if (name) {
                const parts = name.split(' ');
                updateData.firstName = parts[0];
                updateData.lastName = parts.slice(1).join(' ') || '';
            }
            if (contactNumber) updateData.phone = contactNumber;
            // Email usually shouldn't be changed easily for officers without verification, but allowing for now per doc
            if (email) updateData.email = email;

            const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select("-password");
            res.status(200).json({
                success: true,
                data: user,
                message: "Profile updated successfully"
            });
        } catch (err) { next(err); }
    }

    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await User.findById(req.user.id);

            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) return res.status(401).json({ success: false, message: "Invalid current password" });

            const hashed = await bcrypt.hash(newPassword, 8);
            user.password = hashed;
            await user.save();

            res.status(200).json({
                success: true,
                data: null,
                message: "Password updated successfully"
            });
        } catch (err) { next(err); }
    }

    // Notifications
    async getNotifications(req, res, next) {
        try {
            const { unreadOnly } = req.query;
            const query = { userId: req.user.id };
            if (unreadOnly === 'true') query.read = false;

            const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
            res.status(200).json({
                success: true,
                data: notifications,
                message: "Notifications retrieved successfully"
            });
        } catch (err) { next(err); }
    }

    async markNotificationRead(req, res, next) {
        try {
            await Notification.findByIdAndUpdate(req.params.id, { read: true });
            res.status(200).json({
                success: true,
                data: null,
                message: "Marked as read"
            });
        } catch (err) { next(err); }
    }

    // Activity Log - Stub for now
    async getActivityLog(req, res, next) {
        try {
            // If ActivityLog model exists, query it. For now return empty or stub.
            res.status(200).json({
                success: true,
                data: [
                    { action: "Logged In", date: new Date(), details: "Web Portal" }
                ],
                message: "Activity log retrieved successfully"
            });
        } catch (err) { next(err); }
    }

    // Documents
    async uploadDocument(req, res, next) {
        try {
            // File is in req.file thanks to multer
            if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

            // In a real app, we would save metadata to a Document model
            // For now, return the file info
            res.status(201).json({
                success: true,
                data: {
                    filename: req.file.filename,
                    path: req.file.path,
                    originalName: req.file.originalname
                },
                message: "Document uploaded successfully"
            });
        } catch (err) { next(err); }
    }

    async downloadDocument(req, res, next) {
        try {
            await this.serveFile(req, res, false);
        } catch (err) { next(err); }
    }

    // List all documents for an application
    async getApplicationDocuments(req, res, next) {
        try {
            const { appId } = req.params;
            const query = mongoose.isValidObjectId(appId) ? { _id: appId } : { applicationNumber: appId };

            const application = await NOCApplication.findOne(query).select("documents userId applicationNumber");

            if (!application) {
                return res.status(404).json({ success: false, message: "Application not found" });
            }

            // Map documents to include convenient access URLs
            const mappedDocuments = application.documents.map(doc => ({
                documentId: doc.documentId,
                documentType: doc.documentType,
                fileName: doc.fileName,
                originalName: doc.originalName,
                uploadedAt: doc.uploadedAt,
                viewUrl: `/api/officer/common/applications/${appId}/documents/${doc.documentType}/view`,
                downloadUrl: `/api/officer/common/applications/${appId}/documents/${doc.documentType}/download`
            }));

            res.status(200).json({
                success: true,
                data: {
                    applicationNumber: application.applicationNumber,
                    count: mappedDocuments.length,
                    documents: mappedDocuments
                },
                message: "Application documents retrieved successfully"
            });
        } catch (err) { next(err); }
    }

    // Get documents for applications pending verification by this officer's role
    async getPendencyBasedDocuments(req, res, next) {
        try {
            const role = req.user.userType; // DGO, SGWA, ENFORCEMENT
            let statusFilters = [];

            // Define statuses based on flow hierarchy
            if (role === 'DGO') {
                statusFilters = ["SUBMITTED", "PENDING_DGO_REVIEW", "UNDER_REVIEW_DGO", "QUERY_RESPONDED"];
            } else if (role === 'SGWA') {
                statusFilters = ["APPROVED_DGO", "PENDING_SGWA_REVIEW", "UNDER_REVIEW_SGWA"];
            } else if (role === 'ENFORCEMENT') {
                statusFilters = ["APPROVED_SGWA", "PENDING_ENFORCEMENT_REVIEW", "INSPECTION_SCHEDULED", "UNDER_REVIEW_ENFORCEMENT"];
            } else {
                // Fallback for generic officers or admins
                statusFilters = ["SUBMITTED", "PENDING_DGO_REVIEW", "APPROVED_DGO", "APPROVED_SGWA"];
            }

            // Fetch pending applications
            const applications = await NOCApplication.find({ status: { $in: statusFilters } })
                .select("applicationNumber projectDetails.projectName status submittedAt documents")
                .sort({ submittedAt: 1 }); // Oldest first

            // Map results
            const results = applications.map(app => {
                const mappedDocs = app.documents.map(doc => ({
                    documentId: doc.documentId,
                    documentType: doc.documentType,
                    fileName: doc.fileName,
                    status: doc.isVerified ? "VERIFIED" : "PENDING",
                    viewUrl: `/api/officer/common/applications/${app._id}/documents/${doc.documentType}/view`,
                    downloadUrl: `/api/officer/common/applications/${app._id}/documents/${doc.documentType}/download`
                }));

                return {
                    applicationId: app._id,
                    applicationNumber: app.applicationNumber,
                    projectName: app.projectDetails.projectName,
                    status: app.status,
                    submittedDate: app.submittedAt,
                    documentsToVerify: mappedDocs
                };
            });

            res.status(200).json({
                success: true,
                data: results,
                message: "Pendency based documents retrieved successfully"
            });
        } catch (err) { next(err); }
    }

    async viewDocument(req, res, next) {
        try {
            await this.serveFile(req, res, true);
        } catch (err) { next(err); }
    }

    async downloadApplicationDocument(req, res, next) {
        try {
            await this.serveApplicationFile(req, res, false);
        } catch (err) { next(err); }
    }

    async viewApplicationDocument(req, res, next) {
        try {
            await this.serveApplicationFile(req, res, true);
        } catch (err) { next(err); }
    }

    async serveFile(req, res, inline = false) {
        const documentId = req.params.id;
        const path = require("path");
        const fs = require("fs");

        const application = await NOCApplication.findOne({ "documents.documentId": documentId });
        let doc, userId, docType, filename;

        if (application) {
            doc = application.documents.find(d => d.documentId === documentId);
            userId = application.userId;
            docType = doc.documentType || "OTHER";
            filename = doc.fileName;
        } else {
            return res.status(404).json({ success: false, message: "Document not found" });
        }

        if (!filename) return res.status(404).json({ success: false, message: "File metadata missing" });

        const filePath = path.join(process.cwd(), "uploads", userId.toString(), docType, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "File not found on server" });
        }

        if (inline) {
            res.sendFile(filePath);
        } else {
            res.download(filePath, doc.originalName || filename);
        }
    }

    async serveApplicationFile(req, res, inline = false) {
        const { appId, docType } = req.params;
        const path = require("path");
        const fs = require("fs");

        const query = mongoose.isValidObjectId(appId) ? { _id: appId } : { applicationNumber: appId };
        const application = await NOCApplication.findOne(query);

        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const docs = application.documents.filter(d => d.documentType === docType);
        if (docs.length === 0) {
            return res.status(404).json({ success: false, message: `Document of type ${docType} not found` });
        }

        const doc = docs[docs.length - 1]; // Latest
        const userId = application.userId;
        const filename = doc.fileName;

        if (!filename) return res.status(404).json({ success: false, message: "File metadata missing" });

        const filePath = path.join(process.cwd(), "uploads", userId.toString(), doc.documentType || "OTHER", filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "File not found on server" });
        }

        if (inline) {
            res.sendFile(filePath);
        } else {
            res.download(filePath, doc.originalName || filename);
        }
    }

    // Search
    async searchApplications(req, res, next) {
        try {
            const { q, type } = req.query;
            let results = [];
            if (type === 'application' && q) {
                results = await NOCApplication.find({
                    $or: [
                        { applicationNumber: { $regex: q, $options: 'i' } },
                        { "projectDetails.projectName": { $regex: q, $options: 'i' } }
                    ]
                }).select("applicationNumber projectDetails.projectName status submittedDate");
            }
            res.status(200).json({
                success: true,
                data: results,
                message: "Applications search completed successfully"
            });
        } catch (err) { next(err); }
    }

    // Master Data
    async getViolationTypes(req, res) {
        const types = [
            "METER_TAMPERING", "EXCESS_EXTRACTION", "NON_COMPLIANCE_CONDITIONS", "UNAUTHORIZED_USE"
        ];
        res.status(200).json({
            success: true,
            data: types,
            message: "Violation types retrieved successfully"
        });
    }

    async getPenaltyAmounts(req, res) {
        const amounts = {
            "METER_TAMPERING": 50000,
            "EXCESS_EXTRACTION": 100000,
            "MINOR_VIOLATION": 10000
        };
        res.status(200).json({
            success: true,
            data: amounts,
            message: "Penalty amounts retrieved successfully"
        });
    }

    async getDistricts(req, res, next) {
        try {
            const districts = [
                { id: "Jaipur", name: "Jaipur" },
                { id: "Jodhpur", name: "Jodhpur" },
                { id: "Udaipur", name: "Udaipur" }
            ];
            res.status(200).json({
                success: true,
                data: districts,
                message: "Districts retrieved successfully"
            });
        } catch (err) { next(err); }
    }

    async getBlocks(req, res, next) {
        try {
            const blocks = [
                { id: "Block1", name: "Block 1", districtId: "Jaipur" },
                { id: "Block2", name: "Block 2", districtId: "Jaipur" }
            ];
            res.status(200).json({
                success: true,
                data: blocks,
                message: "Blocks retrieved successfully"
            });
        } catch (err) { next(err); }
    }
}

module.exports = new CommonOfficerController();
