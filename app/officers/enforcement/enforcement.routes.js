const router = require("express").Router();
const enforcementController = require("./enforcement.controller");
const authMiddleware = require("../../middleware/auth.middleware");

router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize("ENFORCEMENT"));

// Approval Queue
router.get("/approval-queue", enforcementController.getApprovalQueue);

router.post("/applications/:id/issue-noc", enforcementController.issueNOC);
router.post("/applications/:id/approve", enforcementController.issueNOC); // Alias

router.post("/applications/:id/reject", enforcementController.rejectApplication);

router.post("/applications/:id/return", enforcementController.returnToSGWA);

router.post("/applications/:id/query", enforcementController.raiseQuery);

// Monitoring & Compliance
router.get("/dashboard", enforcementController.getDashboardStats); // Alias for doc compliance
router.get("/compliance/stats", enforcementController.getComplianceStats);

router.get("/nocs", enforcementController.getActiveNOCs); // Doc says /nocs
router.get("/active-nocs", enforcementController.getActiveNOCs);

router.post("/nocs/:id/revoke", enforcementController.revokeNOC);

// router.post("/inspections/schedule", enforcementController.scheduleComplianceInspection); // REMOVED: Enforcement Wing does not schedule inspections
router.post("/inspections/:id/report", enforcementController.submitComplianceReport);

// Violations & Penalties
router.post("/violations/warning", enforcementController.issueWarning);
router.post("/violations/penalty", enforcementController.imposePenalty);
// router.post("/noc/:id/initiate-cancellation", enforcementController.initiateCancellation); // Revoke covers this or is separate step? Keeping both.

// Complaints
router.post("/complaints/register", enforcementController.registerComplaint);
router.get("/complaints/:id", enforcementController.getComplaint);
router.put("/complaints/:id/status", enforcementController.updateComplaintStatus);

router.get("/stats", enforcementController.getDashboardStats);

// NEW: Compliance Monitoring Routes (as per user spec)
router.get("/compliance", enforcementController.getComplianceList);
router.post("/compliance/:nocId/issue-notice", enforcementController.issueViolationNotice);

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
