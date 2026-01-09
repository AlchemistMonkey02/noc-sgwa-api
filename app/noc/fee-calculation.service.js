const NOCApplication = require("./noc-application.model");
const logger = require("../utils/logger");

/**
 * Enhanced Fee Calculation Service
 * Accepts optional manual inputs or automatically fetches from application data
 */
class FeeCalculationService {
    /**
     * Calculate application fees with optional manual inputs
     * @param {string} applicationId - Application ID
     * @param {object} manualInputs - Optional manual inputs for fee calculation
     * @returns {object} Fee details with calculation breakdown
     */
    async calculateFees(applicationId, manualInputs = {}) {
        try {
            // Fetch application
            const application = await NOCApplication.findOne({ applicationId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found"
                };
            }

            // Extract or use manual inputs
            const feeInputs = this.extractFeeInputs(application, manualInputs);

            // Validate we have all required inputs
            this.validateFeeInputs(feeInputs);

            // Calculate fees
            const feeCalculation = this.performFeeCalculation(feeInputs);

            // Save fee calculation to application
            application.feeCalculation = feeCalculation;
            await application.save();

            logger.info(`Fees calculated for application ${applicationId}`, {
                totalAmount: feeCalculation.totalAmount
            });

            return {
                applicationId,
                applicationNumber: application.applicationNumber,
                inputs: feeInputs,
                feeCalculation,
                calculatedAt: new Date()
            };
        } catch (error) {
            logger.error("Error calculating fees", error);
            throw error;
        }
    }

    /**
     * Extract fee calculation inputs from application or use manual inputs
     */
    extractFeeInputs(application, manualInputs) {
        // Priority: Manual inputs > Application data

        // 1. Water Requirement (from Section 4 - Water Requirement Breakup)
        const totalWaterRequirement = manualInputs.waterRequirement ||
            this.calculateTotalWaterRequirement(application);

        // 2. Block Category (from Section 2 - Location Details)
        const blockCategory = manualInputs.blockCategory ||
            application.location?.blockCategory ||
            "SAFE"; // Default to SAFE

        // 3. Sector Type (from Section 1 - Basic Details)
        const sectorType = manualInputs.sectorType ||
            application.sectorType ||
            "INDUSTRIAL";

        // 4. Application Type (from Section 1)
        const applicationType = manualInputs.applicationType ||
            application.applicationType ||
            "NEW";

        // 5. Validity Period (from Section 1)
        const validityPeriod = manualInputs.validityPeriod ||
            application.validityPeriodRequested ||
            3;

        // 6. MSME Status (affects fee exemption/discount)
        const isMSME = manualInputs.isMSME !== undefined ?
            manualInputs.isMSME :
            (application.projectDetails?.isMSME || false);

        // 7. Number of Borewells (from Section 5)
        const numberOfBorewells = manualInputs.numberOfBorewells ||
            application.groundWaterStructures?.length ||
            0;

        return {
            waterRequirement: totalWaterRequirement,
            blockCategory,
            sectorType,
            applicationType,
            validityPeriod,
            isMSME,
            numberOfBorewells
        };
    }

    /**
     * Calculate total water requirement from Section 4
     */
    calculateTotalWaterRequirement(application) {
        if (!application.waterRequirementBreakup || application.waterRequirementBreakup.length === 0) {
            return 0;
        }

        // Sum up all fresh groundwater requirements
        const totalFreshGroundwater = application.waterRequirementBreakup.reduce(
            (sum, item) => sum + (item.freshGroundWater || 0),
            0
        );

        // Also include domestic water requirement
        const domesticRequirement = application.drinkingDomesticUse?.totalDailyDomestic || 0;

        return totalFreshGroundwater + domesticRequirement;
    }

    /**
     * Validate fee calculation inputs
     */
    validateFeeInputs(inputs) {
        if (!inputs.waterRequirement || inputs.waterRequirement <= 0) {
            throw {
                statusCode: 400,
                code: "INVALID_FEE_INPUTS",
                message: "Water requirement must be greater than 0. Please complete Section 3 (Domestic Use) and Section 4 (Water Requirement Breakup) first."
            };
        }

        if (!inputs.blockCategory) {
            throw {
                statusCode: 400,
                code: "INVALID_FEE_INPUTS",
                message: "Block category is required. Please complete Section 2 (Location Details) first."
            };
        }
    }

    /**
     * Perform actual fee calculation
     */
    performFeeCalculation(inputs) {
        const {
            waterRequirement,
            blockCategory,
            sectorType,
            applicationType,
            validityPeriod,
            isMSME,
            numberOfBorewells
        } = inputs;

        // Base fee structure
        const BASE_FEE = 1000;
        const ABSTRACTION_RATE_PER_KL = this.getAbstractionRate(blockCategory, sectorType);
        const BOREWELL_FEE = 500; // Per borewell
        const GST_RATE = 0.18; // 18% GST

        // Calculate components
        const baseFee = applicationType === "RENEWAL" ? BASE_FEE * 0.75 : BASE_FEE;

        // Abstraction charge calculation
        const annualWaterRequirement = waterRequirement * 365; // Daily to Annual
        const abstractionCharge = annualWaterRequirement * ABSTRACTION_RATE_PER_KL;

        // Borewell fee
        const borewellFee = numberOfBorewells * BOREWELL_FEE;

        // Subtotal before GST
        const subtotal = baseFee + abstractionCharge + borewellFee;

        // MSME discount (10% off)
        const msmeDiscount = isMSME ? subtotal * 0.10 : 0;

        // Subtotal after discount
        const subtotalAfterDiscount = subtotal - msmeDiscount;

        // GST calculation
        const gstAmount = subtotalAfterDiscount * GST_RATE;

        // Total amount
        const totalAmount = subtotalAfterDiscount + gstAmount;

        return {
            baseFee: Math.round(baseFee),
            abstractionCharge: {
                rate: ABSTRACTION_RATE_PER_KL,
                dailyRequirement: waterRequirement,
                annualRequirement: annualWaterRequirement,
                charge: Math.round(abstractionCharge)
            },
            borewellFee: {
                numberOfBorewells,
                feePerBorewell: BOREWELL_FEE,
                totalFee: borewellFee
            },
            subtotal: Math.round(subtotal),
            discount: {
                isMSME,
                discountPercentage: isMSME ? 10 : 0,
                discountAmount: Math.round(msmeDiscount)
            },
            subtotalAfterDiscount: Math.round(subtotalAfterDiscount),
            gst: {
                rate: GST_RATE * 100, // Display as percentage
                amount: Math.round(gstAmount)
            },
            totalAmount: Math.round(totalAmount),
            validityPeriod,
            breakdown: this.generateBreakdown(inputs, {
                baseFee,
                abstractionCharge,
                borewellFee,
                msmeDiscount,
                gstAmount,
                totalAmount
            })
        };
    }

    /**
     * Get abstraction rate based on block category and sector
     */
    getAbstractionRate(blockCategory, sectorType) {
        const rates = {
            SAFE: {
                INDUSTRIAL: 0.50,
                DOMESTIC: 0.25,
                COMMERCIAL: 0.40,
                AGRICULTURAL: 0.15
            },
            SEMI_CRITICAL: {
                INDUSTRIAL: 1.00,
                DOMESTIC: 0.50,
                COMMERCIAL: 0.80,
                AGRICULTURAL: 0.30
            },
            CRITICAL: {
                INDUSTRIAL: 2.00,
                DOMESTIC: 1.00,
                COMMERCIAL: 1.60,
                AGRICULTURAL: 0.50
            },
            OVER_EXPLOITED: {
                INDUSTRIAL: 5.00,
                DOMESTIC: 2.00,
                COMMERCIAL: 4.00,
                AGRICULTURAL: 1.00
            }
        };

        return rates[blockCategory]?.[sectorType] || rates.SAFE.INDUSTRIAL;
    }

    /**
     * Generate human-readable breakdown
     */
    generateBreakdown(inputs, calculations) {
        return [
            `Base Application Fee: ₹${calculations.baseFee}`,
            `Water Abstraction Charge: ${inputs.waterRequirement} KL/day × ${this.getAbstractionRate(inputs.blockCategory, inputs.sectorType)} × 365 days = ₹${Math.round(calculations.abstractionCharge)}`,
            inputs.numberOfBorewells > 0 ? `Borewell Fee: ${inputs.numberOfBorewells} borewells × ₹500 = ₹${calculations.borewellFee}` : null,
            inputs.isMSME ? `MSME Discount (10%): -₹${Math.round(calculations.msmeDiscount)}` : null,
            `GST (18%): ₹${Math.round(calculations.gstAmount)}`,
            `Total Amount: ₹${Math.round(calculations.totalAmount)}`
        ].filter(Boolean);
    }
}

module.exports = new FeeCalculationService();
