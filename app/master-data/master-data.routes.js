const router = require("express").Router();
const masterDataController = require("./master-data.controller");

router.get("/application-types", masterDataController.getApplicationTypes);
router.get("/application-sub-types", masterDataController.getApplicationSubTypes);
router.get("/project-types", masterDataController.getProjectTypes);
router.get("/water-quality-types", masterDataController.getWaterQualityTypes);
router.get("/utilization-purposes", masterDataController.getUtilizationPurposes);
router.get("/msme-types", masterDataController.getMSMETypes);
router.get("/organization-types", masterDataController.getOrganizationTypes);
router.get("/project-categories", masterDataController.getProjectCategories);
router.get("/geology-types", masterDataController.getGeologyTypes);
router.get("/geology-types", masterDataController.getGeologyTypes);
router.get("/meter-types", masterDataController.getMeterTypes);
router.get("/area-categories", masterDataController.getAreaCategories);

// Dummy Data Routes
router.get("/meter-manufacturers", masterDataController.getMeterManufacturers);
router.get("/meter-models", masterDataController.getMeterModels);
router.get("/meter-serial-numbers", masterDataController.getSampleSerialNumbers);
router.get("/telemetry-providers", masterDataController.getTelemetryProviders);
router.get("/bis-standards", masterDataController.getBISStandards);
router.get("/nabl-labs", masterDataController.getNABLLabs);

// Consolidated Config Route
router.get("/flow-meter-config", masterDataController.getFlowMeterConfig);

module.exports = router;
