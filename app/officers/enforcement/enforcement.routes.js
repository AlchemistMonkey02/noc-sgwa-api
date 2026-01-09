const router = require("express").Router();
const enforcementController = require("./enforcement.controller");
const authMiddleware = require("../../middleware/auth.middleware");

router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireRole("ENFORCEMENT"));

router.get("/applications", enforcementController.getApplications);
router.get("/applications/:id", enforcementController.getApplicationById);
router.post("/applications/:id/schedule-inspection", enforcementController.scheduleInspection);
router.post("/applications/:id/approve", enforcementController.approveApplication);
router.post("/applications/:id/reject", enforcementController.rejectApplication);
router.post("/applications/:id/query", enforcementController.raiseQuery);
router.get("/stats", enforcementController.getDashboardStats);

module.exports = router;
