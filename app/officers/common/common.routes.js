const router = require("express").Router();
const commonController = require("./common.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const { upload } = require("../../documents/upload.middleware");

router.use(authMiddleware.authenticate);
// Authorize any officer role
router.use(authMiddleware.authorize("DGO", "SGWA", "ENFORCEMENT"));

// Profile
router.get("/profile", commonController.getProfile);
router.put("/profile", commonController.updateProfile);
router.post("/change-password", commonController.changePassword);

// Notifications
router.get("/notifications", commonController.getNotifications);
router.put("/notifications/:id/read", commonController.markNotificationRead);

// Activity Log
router.get("/activity-log", commonController.getActivityLog);

// Documents
router.post("/documents/upload", upload.single('file'), commonController.uploadDocument);
router.get("/documents/:id/download", commonController.downloadDocument);
router.get("/documents/:id/view", commonController.viewDocument);
// Access by Application ID and Document Type
router.get("/documents/pending-verifications", commonController.getPendencyBasedDocuments); // NEW: Worklist based on Role flow
router.get("/applications/:appId/documents", commonController.getApplicationDocuments); // List all
router.get("/applications/:appId/documents/:docType/view", commonController.viewApplicationDocument);
router.get("/applications/:appId/documents/:docType/download", commonController.downloadApplicationDocument);

// Global Search
router.get("/search", commonController.searchApplications);

// Master Data (Officer specific if needed, otherwise uses generic main master API)
// The doc mentions /api/officer/master-data/..., so we map it here
router.get("/master-data/violation-types", commonController.getViolationTypes);
router.get("/master-data/penalty-amounts", commonController.getPenaltyAmounts);
router.get("/master-data/districts", commonController.getDistricts);
router.get("/master-data/blocks", commonController.getBlocks);

module.exports = router;
