const router = require("express").Router();
const documentController = require("./document.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { upload, handleMulterError } = require("./upload.middleware");

// All routes require authentication
router.use(authMiddleware.authenticate);

// POST /api/documents/upload - Upload documents (multiple files)
router.post(
    "/upload",
    upload.array("files", 10),
    documentController.uploadDocument
);

// POST /api/documents/upload/identity - Upload identity documents (Aadhar, PAN)
router.post(
    "/upload/identity",
    upload.array("files", 5),
    documentController.uploadIdentityDocuments
);

// POST /api/documents/upload/company - Upload company documents
router.post(
    "/upload/company",
    upload.array("files", 10),
    documentController.uploadCompanyDocuments
);

// POST /api/documents/upload/noc - Upload NOC-specific documents
router.post(
    "/upload/noc",
    upload.array("files", 15),
    documentController.uploadNOCDocuments
);

// POST /api/documents/upload/clearances - Upload clearance documents
router.post(
    "/upload/clearances",
    upload.array("files", 10),
    documentController.uploadClearanceDocuments
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
