/**
 * Document Requirements Routes
 */

const router = require("express").Router();
const documentRequirementsController = require("./document-requirements.controller");

// POST /api/tools/document-requirements
// Get required documents based on application details
router.post("/document-requirements", documentRequirementsController.getDocumentRequirements);

module.exports = router;
