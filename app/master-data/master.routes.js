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

module.exports = router;
