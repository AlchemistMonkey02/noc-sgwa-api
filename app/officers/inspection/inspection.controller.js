const inspectionService = require("./inspection.service");

class InspectionController {

    async getDashboardStats(req, res, next) {
        try {
            const stats = await inspectionService.getDashboardStats(req.user.id);
            res.status(200).json({
                success: true,
                data: stats,
                message: "Dashboard statistics retrieved successfully"
            });
        } catch (err) { next(err); }
    }

    async getAssignedInspections(req, res, next) {
        try {
            const result = await inspectionService.getAssignedInspections(req.user.id, req.query);
            res.status(200).json({
                success: true,
                data: { inspections: result },
                message: "Assigned inspections retrieved successfully"
            });
        } catch (err) { next(err); }
    }

    async getInspectionDetails(req, res, next) {
        try {
            const result = await inspectionService.getInspectionDetails(req.params.id, req.user.id);
            res.status(200).json({
                success: true,
                data: result,
                message: "Inspection details retrieved successfully"
            });
        } catch (err) { next(err); }
    }

    async startInspection(req, res, next) {
        try {
            const result = await inspectionService.startInspection(req.params.id, req.user.id, req.body);
            res.status(200).json({
                success: true,
                data: result,
                message: "Inspection started successfully"
            });
        } catch (err) { next(err); }
    }

    async uploadPhoto(req, res, next) {
        try {
            if (!req.file) throw { statusCode: 400, message: "No photo uploaded" };

            // Use Document Service to save the file
            const documentService = require("../../documents/document.service");

            // Upload as 'INSPECTION_PHOTO'
            const uploadedDocs = await documentService.uploadDocuments(
                [req.file],
                req.user.id,
                null, // applicationId (could fetch from inspection if needed, or pass null)
                "INSPECTION_PHOTO",
                {
                    description: req.body.description || req.body.tag,
                    inspectionId: req.params.id
                }
            );

            res.status(201).json({
                success: true,
                data: {
                    photoId: uploadedDocs[0].documentId,
                    url: `/api/documents/${uploadedDocs[0].documentId}/view`
                },
                message: "Photo uploaded successfully"
            });
        } catch (err) { next(err); }
    }

    async submitReport(req, res, next) {
        try {
            const result = await inspectionService.submitReport(req.params.id, req.user.id, req.body);
            res.status(200).json({
                success: true,
                data: result,
                message: "Inspection report submitted successfully"
            });
        } catch (err) { next(err); }
    }

    async saveDraft(req, res, next) {
        try {
            const result = await inspectionService.saveDraft(req.params.id, req.user.id, req.body);
            res.status(200).json({
                success: true,
                data: result,
                message: "Inspection draft saved successfully"
            });
        } catch (err) { next(err); }
    }

    async getHistory(req, res, next) {
        try {
            const result = await inspectionService.getHistory(req.user.id);
            res.status(200).json({
                success: true,
                data: result,
                message: "Inspection history retrieved successfully"
            });
        } catch (err) { next(err); }
    }

    async getReport(req, res, next) {
        try {
            const result = await inspectionService.getReport(req.params.id, req.user.id);
            res.status(200).json({
                success: true,
                data: result,
                message: "Inspection report retrieved successfully"
            });
        } catch (err) { next(err); }
    }

    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, remarks } = req.body;
            const result = await inspectionService.updateInspectionStatus(id, req.user.id, status, remarks);
            res.status(200).json({
                success: true,
                data: result,
                message: "Inspection status updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new InspectionController();
