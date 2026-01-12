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

router.post("/inspections/schedule", enforcementController.scheduleComplianceInspection);
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

module.exports = router;
