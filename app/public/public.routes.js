const router = require("express").Router();
const nocController = require("../noc/noc.controller");
const publicController = require("./public.controller");

// Public tracking endpoint (no authentication required)
router.get("/track/:applicationNumber", nocController.trackApplication);

// Know Your EC (Environmental Compensation) Calculator
router.get("/know-your-ec", publicController.calculateKnowYourEC);

module.exports = router;
