const router = require("express").Router();
const calculatorController = require("./calculator.controller");

// All calculator endpoints are public (no authentication required)

// POST /api/tools/ec-calculator
router.post("/ec-calculator", calculatorController.calculateECCharges);

// POST /api/tools/abstraction-charges
router.post("/abstraction-charges", calculatorController.calculateAbstractionCharges);

// POST /api/tools/water-budget
router.post("/water-budget", calculatorController.calculateWaterBudget);

// POST /api/tools/fee-calculator
router.post("/fee-calculator", calculatorController.calculateTotalFees);

module.exports = router;
