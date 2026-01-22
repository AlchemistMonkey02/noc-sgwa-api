const router = require("express").Router();
const masterController = require("./master.controller");

// All routes are public (no authentication required for master data)

// GET /api/master/states
router.get("/states", masterController.getStates);

// GET /api/master/districts?stateId=RAJ
router.get("/districts", masterController.getDistricts);

// GET /api/master/blocks?districtId=JAIPUR
// GET /api/master/blocks?districtId=JAIPUR
router.get("/blocks", masterController.getBlocks);

// GET /api/master/assessment-units?districtId=JAIPUR
router.get("/assessment-units", masterController.getAssessmentUnits);

// GET /api/master/tehsils?districtId=JAIPUR
router.get("/tehsils", masterController.getTehsils);

// GET /api/master/blocks/:districtId/:blockId/category
router.get("/blocks/:districtId/:blockId/category", masterController.getBlockCategory);

// GET /api/master/industry-types?category=MANUFACTURING
router.get("/industry-types", masterController.getIndustryTypes);

// GET /api/master/documents/requirements?applicationType=NEW_NOC
router.get("/documents/requirements", masterController.getDocumentRequirements);

// GET /api/master/fee-structure
router.get("/fees", masterController.getFeeStructure);

// GET /api/master/id-proof-types
router.get("/id-proof-types", masterController.getIdProofTypes);

// GET /api/master/titles
router.get("/titles", masterController.getUserTitles);

// GET /api/master/genders
router.get("/genders", masterController.getGenders);

// ===== NOC Application Master Data Routes =====
const masterDataController = require("./master-data.controller");

// Application Configuration
router.get("/application-types", masterDataController.getApplicationTypes);
router.get("/application-sub-types", masterDataController.getApplicationSubTypes);
router.get("/project-types", masterDataController.getProjectTypes);
router.get("/project-categories", masterDataController.getProjectCategories);
router.get("/water-quality-types", masterDataController.getWaterQualityTypes);
router.get("/utilization-purposes", masterDataController.getUtilizationPurposes);

// Organization Types
router.get("/msme-types", masterDataController.getMSMETypes);
router.get("/organization-types", masterDataController.getOrganizationTypes);

// Flow Meter Configuration
router.get("/flow-meter-config", masterDataController.getFlowMeterConfig);
router.get("/meter-types", masterDataController.getMeterTypes);
router.get("/meter-manufacturers", masterDataController.getMeterManufacturers);
router.get("/meter-models", masterDataController.getMeterModels);
router.get("/telemetry-providers", masterDataController.getTelemetryProviders);
router.get("/bis-standards", masterDataController.getBISStandards);

// Other Master Data
router.get("/geology-types", masterDataController.getGeologyTypes);
router.get("/area-categories", masterDataController.getAreaCategories);
router.get("/nabl-labs", masterDataController.getNABLLabs);

module.exports = router;
