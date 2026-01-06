const router = require("express").Router();
const documentController = require("./document.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { upload, handleMulterError } = require("./upload.middleware");

// All routes require authentication
router.use(authMiddleware.authenticate);

// POST /api/documents/upload - Upload documents (multiple files)
router.post(
    "/upload",
    upload.fields([
        { name: "AADHAR", maxCount: 1 },
        { name: "PAN", maxCount: 1 },
        { name: "LAND_OWNERSHIP", maxCount: 5 },
        { name: "KHASRA_KHATAUNI", maxCount: 1 },
        { name: "SITE_PLAN", maxCount: 1 },
        { name: "BUILDING_PLAN", maxCount: 1 },
        { name: "POLLUTION_NOC", maxCount: 1 },
        { name: "FACTORY_LICENSE", maxCount: 1 },
        { name: "TRADE_LICENSE", maxCount: 1 },
        { name: "GST_CERTIFICATE", maxCount: 1 },
        { name: "UNDERTAKING", maxCount: 1 },
        { name: "WATER_ANALYSIS", maxCount: 1 },
        { name: "OTHER", maxCount: 10 },
    ]),
    handleMulterError,
    documentController.uploadDocuments
);

// GET /api/documents - Get user's documents
router.get("/", documentController.getDocuments);

// GET /api/documents/:id/download - Download document
router.get("/:id/download", documentController.downloadDocument);

// GET /api/documents/:id/view - View document inline
router.get("/:id/view", documentController.viewDocument);

// DELETE /api/documents/:id - Delete document
router.delete("/:id", documentController.deleteDocument);

// PUT /api/documents/:id/verify - Verify document (Officer only)
router.put(
    "/:id/verify",
    authMiddleware.authorize("DGO", "RSGWA", "ENFORCEMENT"),
    documentController.verifyDocument
);

module.exports = router;
