const router = require("express").Router();
const dgoController = require("./dgo.controller");
const authMiddleware = require("../../middleware/auth.middleware");

// All routes require authentication and DGO role
router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireRole("DGO"));

// GET /api/officers/dgo/applications - Get applications for review
router.get("/applications", dgoController.getApplications);

// GET /api/officers/dgo/applications/:id - Get application details
router.get("/applications/:id", dgoController.getApplicationById);

//POST /api/officers/dgo/applications/:id/approve - Approve and forward to SGWA
router.post("/applications/:id/approve", dgoController.approveApplication);

// POST /api/officers/dgo/applications/:id/reject - Reject application
router.post("/applications/:id/reject", dgoController.rejectApplication);

// POST /api/officers/dgo/applications/:id/query - Raise query
router.post("/applications/:id/query", dgoController.raiseQuery);

// GET /api/officers/dgo/stats - Dashboard statistics
router.get("/stats", dgoController.getDashboardStats);

module.exports = router;
