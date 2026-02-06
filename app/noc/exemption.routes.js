const router = require("express").Router();
const exemptionController = require("./exemption.controller");
const exemptionMiddleware = require("./exemption.middleware");

// GET /api/noc/exemption/config - Get form configuration (utilization types)
router.get("/config", exemptionController.getConfig);

// POST /api/noc/exemption
router.post("/", exemptionMiddleware.validateExemptionEligibility, exemptionController.createApplication);
router.post("/check-eligibility", exemptionController.checkEligibility);
router.get("/:applicationId", exemptionController.getApplication);
router.post("/:applicationId/submit", exemptionController.submitApplication);
router.get("/:applicationId/certificate", exemptionController.getCertificate);

module.exports = router;
