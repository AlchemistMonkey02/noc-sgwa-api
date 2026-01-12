const router = require("express").Router();
const nocController = require("./noc.controller");
const authMiddleware = require("../middleware/auth.middleware");
const companyMiddleware = require("../middleware/company.middleware");
const nocValidator = require("./noc.validator");

// Public Routes
// Track Application - Uses RegExp to capture everything including slashes (Express 5 compatible)
router.get(/^\/track\/(.*)/, nocController.trackApplication);

// Approve Timeline Step (Public - No Auth)
router.post("/approve-step", nocController.updateTimelineStep);

// Processing Estimates (Public)
router.get("/processing-estimates", nocController.getProcessingEstimates);

// All routes require authentication
router.use(authMiddleware.authenticate);

// POST /api/applications/noc - Create or update draft (requires verified company)
router.post(
    "/",
    companyMiddleware.verifyCompanyOwnership,
    nocValidator.validateNOCApplication,
    nocController.createOrUpdateApplication
);

// GET /api/applications/noc/dashboard - Get dashboard stats
const dashboardController = require("./dashboard.controller");
router.get("/dashboard", dashboardController.getDashboardData);

// GET /api/applications/noc - List user applications
router.get("/", nocController.getUserApplications);

// GET /api/applications/noc/:id - Get application details
router.get("/:id", nocController.getApplicationById);

// PUT /api/applications/noc/:id - Update application
router.put("/:id", nocValidator.validateNOCApplication, nocController.updateApplication);

// POST /api/applications/noc/:id/submit - Submit application
router.post("/:id/submit", nocController.submitApplication);

// POST /api/applications/noc/:id/withdraw - Withdraw application
router.post("/:id/withdraw", nocController.withdrawApplication);

// GET /api/applications/noc/:id/queries - Get queries
router.get("/:id/queries", nocController.getApplicationQueries);

// POST /api/applications/noc/:id/queries/:queryId/respond - Respond to query
router.post(
    "/:id/queries/:queryId/respond",
    nocValidator.validateQueryResponse,
    nocController.respondToQuery
);

// GET /api/applications/noc/:id/certificate - Get certificate details (View)
router.get("/:id/certificate", nocController.getCertificate);

// GET /api/applications/noc/:id/certificate/download - Download certificate (PDF)
router.get("/:id/certificate/download", nocController.downloadCertificate);

// GET /api/applications/noc/:id/documents/status - Check document upload status
const nocDocController = require("./noc-document-status.controller");
router.get("/:id/documents/status", nocDocController.checkDocumentStatus);

// GET /api/applications/noc/:id/cgwa-compliance - Check CGWA compliance
const cgwaController = require("./noc-cgwa-compliance.controller");
router.get("/:id/cgwa-compliance", cgwaController.checkCGWACompliance);

// Documents
router.post("/:id/documents", nocController.linkDocuments);
router.get("/:id/documents", nocController.getApplicationDocuments);

// NEW: Section-wise update endpoints for 8-section flow
router.put("/:id/section1", nocController.updateSection1); // Basic Details
router.put("/:id/section2", nocController.updateSection2); // Location Details
router.put("/:id/section3", nocController.updateSection3); // Drinking & Domestic Use
router.put("/:id/section4", nocController.updateSection4); // Water Requirement Breakup
router.put("/:id/section5", nocController.updateSection5); // Ground Water Structures
router.put("/:id/section6", nocController.updateSection6); // Document Attachments
router.put("/:id/flow-meter", nocController.updateDigitalFlowMeter); // Digital Flow Meter (New Section)

// NEW: Fee calculation (Section 7)
// Section 7 - Fee Calculation (supports both GET auto-fetch and POST manual-input)
router.get("/:id/calculate-fees", nocController.calculateFees);
router.post("/:id/calculate-fees", nocController.calculateFees);

// NEW: Application summary (Section 8)
router.get("/:id/summary", nocController.getApplicationSummary);

// NEW: AI-driven pre-submission validation
router.get("/:id/validate", nocController.validateApplication);

// NEW: Section status and validation
router.get("/:id/section-status", nocController.getSectionStatus);
router.post("/:id/validate-section/:sectionNumber", nocController.validateSection);

// NEW: Progress tracking
router.get("/:id/progress", nocController.getApplicationProgress);
router.get("/:id/timeline", nocController.getApplicationTimeline);



module.exports = router;
