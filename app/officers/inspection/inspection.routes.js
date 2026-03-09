const router = require("express").Router();
const inspectionController = require("./inspection.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const { upload } = require("../../documents/upload.middleware");

// Auth & Role Check (Allow INSPECTION, DGO, ENFORCEMENT)
router.use(authMiddleware.authenticate);
// Assuming roles are set up. If not, this might block.
// Allowing multiple relevant roles.
router.use(authMiddleware.authorize("INSPECTION", "DGO", "ENFORCEMENT", "SGWA_OFFICER"));

// Dashboard
router.get("/dashboard", inspectionController.getDashboardStats);
router.get("/my-inspections", inspectionController.getAssignedInspections);
router.get("/history", inspectionController.getHistory);

// Inspection Management
router.get("/:id/details", inspectionController.getInspectionDetails);
router.post("/:id/start", inspectionController.startInspection);

// Photo Upload
router.post("/:id/upload-photo", upload.single("file"), inspectionController.uploadPhoto);

// Reporting
router.post("/:id/submit", inspectionController.submitReport);
router.post("/:id/save-draft", inspectionController.saveDraft);

module.exports = router;
