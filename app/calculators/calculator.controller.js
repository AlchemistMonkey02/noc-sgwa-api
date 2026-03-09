const calculatorService = require("./calculator.service");

class CalculatorController {
    /**
     * POST /api/tools/ec-calculator
     * Calculate EC charges
     */
    async calculateECCharges(req, res, next) {
        try {
            const { waterRequirement, blockCategory, industryType } = req.body;

            if (!waterRequirement || !blockCategory) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "MISSING_PARAMETERS",
                        message: "waterRequirement and blockCategory are required",
                    },
                });
            }

            const result = calculatorService.calculateECCharges(
                waterRequirement,
                blockCategory,
                industryType
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "EC charges calculated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/tools/abstraction-charges
     * Calculate abstraction charges
     */
    async calculateAbstractionCharges(req, res, next) {
        try {
            const { annualExtraction, blockCategory, purpose } = req.body;

            if (!annualExtraction || !blockCategory) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "MISSING_PARAMETERS",
                        message: "annualExtraction and blockCategory are required",
                    },
                });
            }

            const result = calculatorService.calculateAbstractionCharges(
                annualExtraction,
                blockCategory,
                purpose
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Abstraction charges calculated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/tools/water-budget
     * Calculate water budget
     */
    async calculateWaterBudget(req, res, next) {
        try {
            const { dynamicResource, proposedExtraction, existingExtraction } = req.body;

            if (!dynamicResource || !proposedExtraction) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "MISSING_PARAMETERS",
                        message: "dynamicResource and proposedExtraction are required",
                    },
                });
            }

            const result = calculatorService.calculateWaterBudget(
                dynamicResource,
                proposedExtraction,
                existingExtraction
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Water budget calculated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/tools/fee-calculator
     * Calculate total fees
     */
    async calculateTotalFees(req, res, next) {
        try {
            const {
                applicationType,
                blockCategory,
                waterRequirement,
                industryType,
                gstRate,
                baseAmount,
            } = req.body;

            if (!applicationType || !blockCategory || !waterRequirement) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "MISSING_PARAMETERS",
                        message: "applicationType, blockCategory, and waterRequirement are required",
                    },
                });
            }

            // Validate custom base amount if provided
            if (baseAmount) {
                const amount = parseFloat(baseAmount);
                if (isNaN(amount) || amount < 5000 || amount > 100000) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: "INVALID_BASE_AMOUNT",
                            message: "Base amount must be between 5,000 and 1,00,000",
                        },
                    });
                }
            }

            const result = calculatorService.calculateTotalFees(
                applicationType,
                blockCategory,
                waterRequirement,
                industryType,
                gstRate,
                baseAmount
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Fees calculated successfully"
            });
        } catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/tools/pump-discharge
     * Calculate pump discharge rate
     */
    async calculatePumpDischarge(req, res, next) {
        try {
            const { hp, depth, efficiency } = req.body;

            if (!hp || !depth) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "MISSING_PARAMETERS",
                        message: "hp and depth are required",
                    },
                });
            }

            const result = calculatorService.calculatePumpDischarge(
                parseFloat(hp),
                parseFloat(depth),
                efficiency ? parseFloat(efficiency) : undefined
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Pump discharge calculated successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CalculatorController();
