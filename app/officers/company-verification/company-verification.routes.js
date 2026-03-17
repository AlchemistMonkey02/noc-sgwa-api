const router = require("express").Router();
const companyVerificationController = require("./company-verification.controller");
const authMiddleware = require("../../middleware/auth.middleware");

// All routes require authentication and officer role (DGO/SGWA/ENFORCEMENT)
router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireRole(["DGO", "SGWA", "RSGWA", "ENFORCEMENT"]));

// GET /api/officers/company-verification/stats - Get statistics
router.get("/stats", companyVerificationController.getStats);

// GET /api/officers/company-verification/pending - Get pending companies
router.get("/pending", companyVerificationController.getPendingCompanies);

// GET /api/officers/company-verification/:companyId - Get company details
router.get("/:companyId", companyVerificationController.getCompanyDetails);

// POST /api/officers/company-verification/:companyId/verify - Verify company
router.post("/:companyId/verify", companyVerificationController.verifyCompany);

// POST /api/officers/company-verification/:companyId/reject - Reject company
router.post("/:companyId/reject", companyVerificationController.rejectCompany);

module.exports = router;
