const router = require("express").Router();
const eligibilityController = require("./eligibility.controller");

// Get Metadata (Districts)
router.get("/check-eligibility/metadata", eligibilityController.getMetadata);

// Get Blocks for District
router.get("/check-eligibility/blocks", eligibilityController.getBlocks);

// Check Eligibility
router.post("/check-eligibility", eligibilityController.checkEligibility);

module.exports = router;
