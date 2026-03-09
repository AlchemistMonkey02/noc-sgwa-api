const router = require("express").Router();
const sgwaController = require("./sgwa.controller");
const authMiddleware = require("../../middleware/auth.middleware");

router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize("SGWA", "RSGWA"));

router.get("/applications", sgwaController.getApplications);
router.get("/applications/technical-review", sgwaController.getTechnicalReviewApplications);
router.get("/applications/pending", sgwaController.getPendingApplications);
router.get("/applications/:id", sgwaController.getApplicationById);
router.post("/applications/:id/approve", sgwaController.approveApplication);
router.post("/applications/:id/reject", sgwaController.rejectApplication);
router.post("/applications/:id/query", sgwaController.raiseQuery);
router.post("/applications/:id/assign", sgwaController.assignApplication);
router.post("/applications/:id/notes", sgwaController.addInternalNote); // New Note Route

// Query Management
router.get("/queries", sgwaController.getQueries);
router.get("/queries/:queryId", sgwaController.viewQuery);
router.post("/queries/:queryId/accept", sgwaController.acceptQuery);
router.post("/queries/:queryId/reject", sgwaController.rejectQuery);

router.post("/reports/generate", sgwaController.generateReports);
router.get("/dashboard", sgwaController.getDashboardStats); // Exact match for doc
router.get("/stats", sgwaController.getDashboardStats);

// Analytics & Reports
router.get("/metrics", sgwaController.getMetrics);
router.get("/analytics", sgwaController.getMetrics); // Map to same for now
router.get("/export", sgwaController.exportData);

// Documents
const { upload } = require("../../documents/upload.middleware");
router.post("/documents/upload", upload.single("file"), sgwaController.uploadDocument);
router.get("/documents/:id/download", sgwaController.downloadDocument);
router.get("/documents/:id/view", sgwaController.viewDocument);

// Notifications
router.get("/notifications", sgwaController.getNotifications);
router.put("/notifications/:id/read", sgwaController.markNotificationRead);

// Admin (Stubs)
router.get("/admin/officers", (req, res) => res.json({ success: true, data: { officers: [] } }));

// NEW: Simple Document Verification (documentId in body)
const simpleDocVerify = require("../../documents/simple-doc-verify.service");
router.post("/verify-document", async (req, res, next) => {
    try {
        const { documentId, status, remarks } = req.body;
        const document = await simpleDocVerify.verifyDocument(
            documentId,
            req.user.id,
            req.user.userType || req.user.role,
            { status, remarks }
        );
        res.json({
            success: true,
            data: document,
            message: `Document ${status.toLowerCase()} by ${req.user.userType || req.user.role}`
        });
    } catch (error) {
        next(error);
    }
});

// NEW: Bulk Document Verification
const bulkDocVerify = require("../../documents/bulk-doc-verify.service");
router.post("/verify-documents-bulk", async (req, res, next) => {
    try {
        const { documentIds, status, remarks } = req.body;
        const result = await bulkDocVerify.verifyMultipleDocuments(
            documentIds,
            req.user.id,
            req.user.userType || req.user.role,
            { status, remarks }
        );
        res.json({
            success: true,
            data: result,
            message: `Verified ${result.successCount} of ${result.totalDocuments} documents`
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
