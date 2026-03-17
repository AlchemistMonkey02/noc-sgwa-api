const router = require("express").Router();
const companyController = require("./company.controller");
const companyValidator = require("./company.validator");
const authMiddleware = require("../middleware/auth.middleware");

// Public Routes
router.get("/types", companyController.getCompanyTypes);

// All routes below require authentication
router.use(authMiddleware.authenticate);

// User Routes
const { upload } = require("../documents/upload.middleware");

router.post(
    "/register",
    upload.fields([
        { name: "companyPan", maxCount: 1 },
        { name: "gstCertificate", maxCount: 1 },
        { name: "incorporationCertificate", maxCount: 1 },
        { name: "authorizationLetter", maxCount: 1 },
    ]),
    (req, res, next) => {
        // Handle multipart/form-data with JSON in 'data' field
        if (req.body.data) {
            try {
                const parsedData = JSON.parse(req.body.data);
                req.body = { ...req.body, ...parsedData };
                delete req.body.data;
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_JSON",
                        message: "Invalid JSON in 'data' field",
                    },
                });
            }
        }
        next();
    },
    companyValidator.validateRegisterCompany,
    companyController.registerCompany
);


router.get("/", companyController.getUserCompanies);
router.get("/stats", companyController.getCompanyStats);
router.get("/profile", companyController.getCompanyProfile);
router.get("/:id/documents", companyController.getCompanyDocuments);
router.post(
    "/:id/documents/upload",
    upload.single("document"),
    companyController.uploadCompanyDocument
);
router.get("/:id", companyController.getCompanyById);

router.put(
    "/:id",
    upload.fields([
        { name: "companyPan", maxCount: 1 },
        { name: "gstCertificate", maxCount: 1 },
        { name: "incorporationCertificate", maxCount: 1 },
        { name: "authorizationLetter", maxCount: 1 },
    ]),
    (req, res, next) => {
        if (req.body.data) {
            try {
                const parsedData = JSON.parse(req.body.data);
                req.body = { ...req.body, ...parsedData };
                delete req.body.data;
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_JSON",
                        message: "Invalid JSON in 'data' field",
                    },
                });
            }
        }
        next();
    },
    companyValidator.validateUpdateCompany,
    companyController.updateCompany
);

router.delete("/:id", companyController.deleteCompany);

// Officer Routes (require officer role)
router.get(
    "/officer/all",
    authMiddleware.authorize(["DGO", "SGWA", "RSGWA"]),
    companyController.getAllCompanies
);

router.put(
    "/officer/:id/verify",
    authMiddleware.authorize(["DGO", "SGWA", "RSGWA"]),
    companyController.verifyCompany
);

router.put(
    "/officer/:id/verify-document",
    authMiddleware.authorize(["DGO", "SGWA", "RSGWA"]),
    companyController.verifyCompanyDocument
);

module.exports = router;
