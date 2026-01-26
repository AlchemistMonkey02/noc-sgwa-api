const router = require("express").Router();
const selfComplianceController = require("./self-compliance.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { upload } = require("../documents/upload.middleware");

// All routes require authentication
router.use(authMiddleware.authenticate);

// Start
router.post("/start", selfComplianceController.startSession);

// Submit Step Data
router.post("/:id/step", selfComplianceController.submitStep);

// Upload Document
router.post("/:id/upload", upload.single("file"), selfComplianceController.uploadDocument);

// Final Submit
router.post("/:id/submit", selfComplianceController.submitCompliance);

// Get Status
router.get("/:id/status", selfComplianceController.getStatus);

module.exports = router;
