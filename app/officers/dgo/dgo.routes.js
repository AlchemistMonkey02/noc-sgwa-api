const router = require("express").Router();
const dgoController = require("./dgo.controller");
const authMiddleware = require("../../middleware/auth.middleware");

console.log("================================================");
console.log(">>> DGO ROUTES LOADING...");
console.log(">>> verifyDocuments handler type:", typeof dgoController.verifyDocuments);
console.log("================================================");



// All routes require authentication and DGO role
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize("DGO"));



// GET /api/officers/dgo/officers - Get officers list
router.get("/officers", dgoController.getOfficers);

// Debug Ping (Updated)
router.get("/ping", (req, res) => res.json({ message: "DGO Routes Active", version: "v_probe_1", timestamp: new Date() }));

// POST /api/officer/dgo/applications/:id/verify-documents
// Moved to top to ensure priority
router.post("/applications/:id/verify-documents", dgoController.verifyDocuments);

// GET /api/officers/dgo/applications - Get applications for review
router.get("/applications", dgoController.getApplications);

// GET /api/officers/dgo/applications/:id - Get application details
router.get("/applications/:id", dgoController.getApplicationById);

// POST /api/officers/dgo/applications/:id/approve - Approve and forward to SGWA
router.post("/applications/:id/approve", dgoController.approveApplication);

// POST /api/officers/dgo/applications/:id/reject - Reject application
router.post("/applications/:id/reject", dgoController.rejectApplication);

// POST /api/officers/dgo/applications/:id/schedule-inspection
router.post("/applications/:id/schedule-inspection", dgoController.scheduleInspection);

// POST /api/officers/dgo/applications/:id/inspection-report
router.post("/applications/:id/inspection-report", dgoController.submitInspectionReport);

// GET /api/officers/dgo/inspections/:id/report
router.get("/inspections/:id/report", dgoController.getInspectionReport);

// POST /api/officers/dgo/applications/:id/query - Raise query
router.post("/applications/:id/query", dgoController.raiseQuery);

// GET /api/officers/dgo/stats - Dashboard statistics
router.get("/stats", dgoController.getDashboardStats);

// POST /api/officers/dgo/applications/:id/forward - Recommend/Forward to SGWA
router.post("/applications/:id/forward", dgoController.approveApplication);

// Query Management Routes
router.get("/queries", dgoController.getQueries);
router.get("/queries/:id", dgoController.getQueryById);
router.post("/queries/:id/accept", dgoController.acceptQueryResponse);
router.post("/queries/:id/reject", dgoController.rejectQueryResponse);

// Report Routes
router.get("/compliance-report", dgoController.getComplianceReport); // New Endpoint
router.post("/reports/generate", dgoController.generateReport); // New Endpoint

// GET /api/officers/dgo/dashboard - Dashboard statistics and recent applications
router.get("/dashboard", dgoController.getDashboardStats);

// GET /api/officers/dgo/officers - Get officers list (Moved to top)

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

// NEW: Bulk Document Verification (verify multiple at once)
const bulkDocVerify = require("../../documents/bulk-doc-verify.service");
const authController = require("../../auth/auth.controller");
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
