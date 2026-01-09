const router = require("express").Router();
const sgwaController = require("./sgwa.controller");
const authMiddleware = require("../../middleware/auth.middleware");

router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireRole("SGWA"));

router.get("/applications", sgwaController.getApplications);
router.get("/applications/:id", sgwaController.getApplicationById);
router.post("/applications/:id/approve", sgwaController.approveApplication);
router.post("/applications/:id/reject", sgwaController.rejectApplication);
router.post("/applications/:id/query", sgwaController.raiseQuery);
router.get("/stats", sgwaController.getDashboardStats);

module.exports = router;
