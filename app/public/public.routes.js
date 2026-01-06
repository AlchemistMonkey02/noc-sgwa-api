const router = require("express").Router();
const nocController = require("../noc/noc.controller");

// Public tracking endpoint (no authentication required)
router.get("/:applicationNumber", nocController.trackApplication);

module.exports = router;
