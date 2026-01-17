const inspectionService = require("./inspection.service");

class InspectionController {

    async getDashboardStats(req, res, next) {
        try {
            const stats = await inspectionService.getDashboardStats(req.user.id);
            res.json({ success: true, data: stats });
        } catch (err) { next(err); }
    }

    async getAssignedInspections(req, res, next) {
        try {
            const result = await inspectionService.getAssignedInspections(req.user.id, req.query);
            res.json({ success: true, data: result });
        } catch (err) { next(err); }
    }

    async getInspectionDetails(req, res, next) {
        try {
            const result = await inspectionService.getInspectionDetails(req.params.id, req.user.id);
            res.json({ success: true, data: result });
        } catch (err) { next(err); }
    }

    async startInspection(req, res, next) {
        try {
            const result = await inspectionService.startInspection(req.params.id, req.user.id, req.body);
            res.json({ success: true, ...result });
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

            res.json({
                success: true,
                data: {
                    photoId: uploadedDocs[0].documentId,
                    url: `/api/documents/${uploadedDocs[0].documentId}/view`
                }
            });
        } catch (err) { next(err); }
    }

    async submitReport(req, res, next) {
        try {
            const result = await inspectionService.submitReport(req.params.id, req.user.id, req.body);
            res.json({ success: true, ...result });
        } catch (err) { next(err); }
    }

    async saveDraft(req, res, next) {
        try {
            const result = await inspectionService.saveDraft(req.params.id, req.user.id, req.body);
            res.json({ success: true, ...result });
        } catch (err) { next(err); }
    }

    async getHistory(req, res, next) {
        try {
            const result = await inspectionService.getHistory(req.user.id);
            res.json({ success: true, data: result });
        } catch (err) { next(err); }
    }
}

module.exports = new InspectionController();
