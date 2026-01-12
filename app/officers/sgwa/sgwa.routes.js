const router = require("express").Router();
const sgwaController = require("./sgwa.controller");
const authMiddleware = require("../../middleware/auth.middleware");

router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize("SGWA"));

router.get("/applications", sgwaController.getApplications);
router.get("/applications/:id", sgwaController.getApplicationById);
router.post("/applications/:id/approve", sgwaController.approveApplication);
router.post("/applications/:id/reject", sgwaController.rejectApplication);
router.post("/applications/:id/query", sgwaController.raiseQuery);
router.post("/applications/:id/assign", sgwaController.assignApplication);
router.post("/reports/generate", sgwaController.generateReports);
router.get("/dashboard", sgwaController.getDashboardStats); // Exact match for doc
router.get("/stats", sgwaController.getDashboardStats);

module.exports = router;
