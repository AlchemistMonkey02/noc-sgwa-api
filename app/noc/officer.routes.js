const router = require("express").Router();
const officerController = require("./officer.controller");
const authMiddleware = require("../middleware/auth.middleware");
const nocValidator = require("./noc.validator");

// All routes require officer authentication
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize("DGO", "SGWA", "ENFORCEMENT"));

// GET /api/officer/applications - Get applications for review
router.get("/applications", officerController.getApplications);

// POST /api/officer/applications/:id/assign - Assign to self
router.post("/applications/:id/assign", officerController.assignApplication);

// POST /api/officer/applications/:id/query - Raise query
router.post(
    "/applications/:id/query",
    nocValidator.validateRaiseQuery,
    officerController.raiseQuery
);

// POST /api/officer/applications/:id/approve - Approve application
router.post(
    "/applications/:id/approve",
    nocValidator.validateApprove,
    officerController.approveApplication
);

// POST /api/officer/applications/:id/reject - Reject application
router.post(
    "/applications/:id/reject",
    nocValidator.validateReject,
    officerController.rejectApplication
);

module.exports = router;
