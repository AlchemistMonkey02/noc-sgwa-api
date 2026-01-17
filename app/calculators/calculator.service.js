const logger = require("../utils/logger");

class CalculatorService {
    /**
     * Calculate EC (Environmental Compensation) Charges
     * Based on water requirement and block category
     */
    calculateECCharges(waterRequirement, blockCategory, industryType = "GENERAL") {
        try {
            // EC charges per MLD based on block category
            const ecRates = {
                SAFE: 1000,
                SEMI_CRITICAL: 2000,
                CRITICAL: 3000,
                OVER_EXPLOITED: 5000,
            };

            // Industry multipliers
            const industryMultipliers = {
                AGRICULTURE: 0.5,
                DOMESTIC: 0.7,
                COMMERCIAL: 1.0,
                MANUFACTURING: 1.2,
                MINING: 1.5,
                GENERAL: 1.0,
            };

            const baseRate = ecRates[blockCategory] || ecRates.SAFE;
            const multiplier = industryMultipliers[industryType] || 1.0;

            const ecCharges = waterRequirement * baseRate * multiplier;

            return {
                waterRequirement,
                blockCategory,
                industryType,
                baseRate,
                multiplier,
                ecCharges: Math.round(ecCharges),
                ecChargesPerMLD: baseRate,
                calculation: `${waterRequirement} MLD × ₹${baseRate}/MLD × ${multiplier} = ₹${Math.round(ecCharges)}`,
            };
        } catch (error) {
            logger.error("Error calculating EC charges", error);
            throw error;
        }
    }

    /**
     * Calculate Abstraction Charges
     * Based on water extraction volume and usage
     */
    calculateAbstractionCharges(
        annualExtraction,
        blockCategory,
        purpose = "GENERAL"
    ) {
        try {
            // Abstraction rates per Ham (Hectare Meter)
            const abstractionRates = {
                SAFE: 50,
                SEMI_CRITICAL: 100,
                CRITICAL: 200,
                OVER_EXPLOITED: 500,
            };

            // Purpose-based multipliers
            const purposeMultipliers = {
                AGRICULTURE: 0.6,
                DOMESTIC: 0.8,
                INDUSTRIAL: 1.0,
                COMMERCIAL: 1.2,
                MINING: 1.5,
                GENERAL: 1.0,
            };

            const baseRate = abstractionRates[blockCategory] || abstractionRates.SAFE;
            const multiplier = purposeMultipliers[purpose] || 1.0;

            const abstractionCharges = annualExtraction * baseRate * multiplier;

            // Calculate stage of extraction impact
            const stageMultiplier =
                blockCategory === "OVER_EXPLOITED"
                    ? 2.0
                    : blockCategory === "CRITICAL"
                        ? 1.5
                        : 1.0;

            const totalCharges = abstractionCharges * stageMultiplier;

            return {
                annualExtraction,
                blockCategory,
                purpose,
                baseRate,
                purposeMultiplier: multiplier,
                stageMultiplier,
                abstractionCharges: Math.round(abstractionCharges),
                totalCharges: Math.round(totalCharges),
                calculation: `${annualExtraction} Ham × ₹${baseRate}/Ham × ${multiplier} × ${stageMultiplier} = ₹${Math.round(totalCharges)}`,
            };
        } catch (error) {
            logger.error("Error calculating abstraction charges", error);
            throw error;
        }
    }

    /**
     * Calculate Water Budget
     * Determines if NOC is required based on extraction vs resources
     */
    calculateWaterBudget(
        dynamicResource,
        proposedExtraction,
        existingExtraction = 0
    ) {
        try {
            const totalExtraction = proposedExtraction + existingExtraction;
            const stageOfExtraction = (totalExtraction / dynamicResource) * 100;

            // Determine category
            let category;
            let nocRequired;
            let validityYears;
            let recommendedAction;

            if (stageOfExtraction < 70) {
                category = "SAFE";
                nocRequired = true;
                validityYears = 5;
                recommendedAction = "NOC can be granted with standard conditions";
            } else if (stageOfExtraction < 90) {
                category = "SEMI_CRITICAL";
                nocRequired = true;
                validityYears = 3;
                recommendedAction = "NOC can be granted with monitoring conditions";
            } else if (stageOfExtraction < 100) {
                category = "CRITICAL";
                nocRequired = true;
                validityYears = 1;
                recommendedAction =
                    "NOC may be granted with strict monitoring and review";
            } else {
                category = "OVER_EXPLOITED";
                nocRequired = true;
                validityYears = 0;
                recommendedAction =
                    "New NOC not recommended. Only renewal for existing users with reduced extraction";
            }

            const availableResource = Math.max(0, dynamicResource - existingExtraction);
            const exceedsCapacity = proposedExtraction > availableResource;

            return {
                dynamicGroundWaterResource: dynamicResource,
                existingExtraction,
                proposedExtraction,
                totalExtraction,
                availableResource,
                stageOfExtraction: Math.round(stageOfExtraction * 100) / 100,
                category,
                nocRequired,
                exceedsCapacity,
                validityYears,
                recommendedAction,
                warning:
                    exceedsCapacity
                        ? "Proposed extraction exceeds available resource capacity"
                        : null,
            };
        } catch (error) {
            logger.error("Error calculating water budget", error);
            throw error;
        }
    }

    /**
     * Calculate complete fee structure
     * Combines all charges for NOC application
     */
    calculateTotalFees(
        applicationType,
        blockCategory,
        waterRequirement,
        industryType = "GENERAL",
        gstRate = 18,
        customBaseAmount = null
    ) {
        try {
            // Base fees by application type
            const baseFees = {
                NEW: {
                    SAFE: 5000,
                    SEMI_CRITICAL: 10000,
                    CRITICAL: 15000,
                    OVER_EXPLOITED: 20000,
                },
                RENEWAL: {
                    SAFE: 3000,
                    SEMI_CRITICAL: 5000,
                    CRITICAL: 8000,
                    OVER_EXPLOITED: 10000,
                },
                AMENDMENT: {
                    SAFE: 2000,
                    SEMI_CRITICAL: 3000,
                    CRITICAL: 5000,
                    OVER_EXPLOITED: 7000,
                },
            };

            // Use custom base amount if provided, otherwise fallback to standard rates
            const baseAmount = customBaseAmount
                ? parseFloat(customBaseAmount)
                : baseFees[applicationType]?.[blockCategory] || baseFees.NEW.SAFE;

            // EC charges
            const ecResult = this.calculateECCharges(
                waterRequirement,
                blockCategory,
                industryType
            );

            // Fixed fees
            const processingFee = 500;
            const waterBudgetCharges = blockCategory === "OVER_EXPLOITED" ? 1000 : 500;
            const inspectionFee = applicationType === "NEW" ? 1000 : 0;

            const subTotal =
                baseAmount +
                ecResult.ecCharges +
                processingFee +
                waterBudgetCharges +
                inspectionFee;

            // Calculate GST based on custom rate or default 18%
            const gstPercent = parseFloat(gstRate) / 100;
            const gst = Math.round(subTotal * gstPercent);
            const totalAmount = subTotal + gst;

            return {
                applicationType,
                blockCategory,
                waterRequirement,
                industryType,
                gstRate: `${gstRate}%`,
                breakdown: {
                    baseAmount,
                    ecCharges: ecResult.ecCharges,
                    processingFee,
                    waterBudgetCharges,
                    inspectionFee,
                    subTotal,
                    gst,
                },
                totalAmount,
            };
        } catch (error) {
            logger.error("Error calculating total fees", error);
            throw error;
        }
    }
    /**
     * Calculate Pump Discharge Rate
     * Estimation based on HP and Head (Depth)
     */
    calculatePumpDischarge(hp, depth, efficiency = 0.6) {
        try {
            // Formula: HP = (Q * H) / (75 * efficiency) where Q is L/s
            // Rearranged: Q (L/s) = (HP * 75 * efficiency) / H

            if (!depth || depth <= 0) {
                throw { message: "Depth must be greater than 0" };
            }

            const dischargeLPS = (hp * 75 * efficiency) / depth;
            const dischargeM3Hr = dischargeLPS * 3.6; // Convert L/s to m3/hr

            return {
                hp,
                depth,
                efficiency: `${efficiency * 100}%`,
                estimatedDischargeLPS: Math.round(dischargeLPS * 100) / 100,
                estimatedDischargeM3Hr: Math.round(dischargeM3Hr * 100) / 100,
                formulaUsed: "Q (m³/hr) = ((HP × 75 × Efficiency) / Depth) × 3.6"
            };
        } catch (error) {
            logger.error("Error calculating pump discharge", error);
            throw error;
        }
    }
}

module.exports = new CalculatorService();
