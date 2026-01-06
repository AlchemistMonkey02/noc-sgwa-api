const router = require("express").Router();
const nocController = require("./noc.controller");
const authMiddleware = require("../middleware/auth.middleware");
const nocValidator = require("./noc.validator");

// All routes require authentication
router.use(authMiddleware.authenticate);

// POST /api/applications/noc - Create or update draft
router.post("/", nocValidator.validateNOCApplication, nocController.createOrUpdateApplication);

// GET /api/applications/noc - List user applications
router.get("/", nocController.getUserApplications);

// GET /api/applications/noc/:id - Get application details
router.get("/:id", nocController.getApplicationById);

// PUT /api/applications/noc/:id - Update application
router.put("/:id", nocValidator.validateNOCApplication, nocController.updateApplication);

// POST /api/applications/noc/:id/submit - Submit application
router.post("/:id/submit", nocController.submitApplication);

// POST /api/applications/noc/:id/withdraw - Withdraw application
router.post("/:id/withdraw", nocController.withdrawApplication);

// GET /api/applications/noc/:id/queries - Get queries
router.get("/:id/queries", nocController.getApplicationQueries);

// POST /api/applications/noc/:id/queries/:queryId/respond - Respond to query
router.post(
    "/:id/queries/:queryId/respond",
    nocValidator.validateQueryResponse,
    nocController.respondToQuery
);

// GET /api/applications/noc/:id/certificate - Get certificate
router.get("/:id/certificate", nocController.getCertificate);

module.exports = router;
