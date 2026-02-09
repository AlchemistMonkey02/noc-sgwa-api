const router = require("express").Router();
const nocController = require("../noc/noc.controller");
const publicController = require("./public.controller");

// Public tracking endpoint (no authentication required)
router.get("/track/:applicationNumber", nocController.trackApplication);

// Know Your EC (Environmental Compensation) Calculator
router.get("/know-your-ec", publicController.calculateKnowYourEC);

// Public Document Upload
const publicDocumentController = require("./public.document.controller");
const { upload } = require("../documents/upload.middleware");

// POST /api/public/documents/upload
router.post(
    "/documents/upload",
    upload.single("file"),
    publicDocumentController.uploadPublicDocument
);

module.exports = router;
