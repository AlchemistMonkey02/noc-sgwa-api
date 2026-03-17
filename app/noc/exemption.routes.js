const router = require("express").Router();
const exemptionController = require("./exemption.controller");
const exemptionMiddleware = require("./exemption.middleware");
const authMiddleware = require("../middleware/auth.middleware");

// GET /api/noc/exemption/config - Get form configuration (utilization types)
router.get("/config", exemptionController.getConfig);

// Optional authentication to capture userId if logged in
router.use(authMiddleware.authenticateOptional || ((req, res, next) => {
    // Basic optional auth logic if authenticateOptional is not defined
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authMiddleware.authenticate(req, res, next);
    }
    next();
}));

// POST /api/noc/exemption
router.post("/", exemptionMiddleware.validateExemptionEligibility, exemptionController.createApplication);
router.post("/check-eligibility", exemptionController.checkEligibility);
router.get("/:applicationId", exemptionController.getApplication);
router.post("/:applicationId/submit", exemptionController.submitApplication);
router.get("/:applicationId/certificate", exemptionController.getCertificate);

module.exports = router;
