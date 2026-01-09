const router = require("express").Router();
const companyController = require("./company.controller");
const companyValidator = require("./company.validator");
const authMiddleware = require("../middleware/auth.middleware");

// All routes require authentication
router.use(authMiddleware.authenticate);

// User Routes
router.post(
    "/register",
    companyValidator.validateRegisterCompany,
    companyController.registerCompany
);

router.get("/", companyController.getUserCompanies);
router.get("/stats", companyController.getCompanyStats);
router.get("/:id", companyController.getCompanyById);

router.put(
    "/:id",
    companyValidator.validateUpdateCompany,
    companyController.updateCompany
);

router.delete("/:id", companyController.deleteCompany);

// Officer Routes (require officer role)
router.get(
    "/officer/all",
    authMiddleware.authorize(["DGO", "RSGWA"]),
    companyController.getAllCompanies
);

router.put(
    "/officer/:id/verify",
    authMiddleware.authorize(["DGO", "RSGWA"]),
    companyController.verifyCompany
);

module.exports = router;
