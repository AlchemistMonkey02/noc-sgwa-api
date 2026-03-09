
class PublicController {
    /**
     * Calculate Environmental Compensation (EC)
     * Formula: EC = Q * ECR * Days
     * Q: Water Extraction (m3/day)
     * ECR: Environmental Compensation Rate (varies by Area)
     * Days: Number of days of violation
     */
    calculateKnowYourEC(req, res, next) {
        try {
            const {
                applicationType,
                waterQualityType, // FRESH, SALINE
                areaTypeCategory, // SAFE, SEMI_CRITICAL, CRITICAL, OVER_EXPLOITED
                areaCategory, // Fallback for backward compatibility
                dateFrom,
                dateTo,
                dailyExtraction, // m3/day
                annualExtraction // m3/year (Not used in formula but required in form)
            } = req.query;

            // Normalize Area Category
            const finalAreaCategory = areaTypeCategory || areaCategory;

            // Basic Validation
            if (!waterQualityType || !finalAreaCategory || !dateFrom || !dateTo || !dailyExtraction) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required parameters: waterQualityType, areaTypeCategory (or areaCategory), dateFrom, dateTo, dailyExtraction"
                });
            }

            // Calculate Days
            const start = new Date(dateFrom);
            const end = new Date(dateTo);
            const diffTime = Math.abs(end - start);
            const daysOfViolation = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

            if (isNaN(daysOfViolation)) {
                return res.status(400).json({ success: false, message: "Invalid Date Range" });
            }

            const Q = parseFloat(dailyExtraction);

            // Standard CGWA Rates (Simplified for Demo)
            const rates = {
                'SAFE': 10,
                'SEMI_CRITICAL': 20,
                'CRITICAL': 40,
                'OVER_EXPLOITED': 80
            };

            // Logic: For Saline Water, EC Rates for Safe category shall be applied
            let appliedCategory = finalAreaCategory.toUpperCase();
            let isSalineOverride = false;

            if (waterQualityType.toUpperCase() === 'SALINE') {
                appliedCategory = 'SAFE';
                isSalineOverride = true;
            }

            let ECR = rates[appliedCategory] || 20; // Default fallback

            const totalEC = Q * ECR * daysOfViolation;

            res.status(200).json({
                success: true,
                data: {
                    input: {
                        applicationType,
                        waterQualityType,
                        areaTypeCategory: finalAreaCategory,
                        dateRange: { from: dateFrom, to: dateTo, totalDays: daysOfViolation },
                        dailyExtraction: Q,
                        annualExtraction
                    },
                    calculation: {
                        appliedCategory: appliedCategory,
                        isSalineOverride: isSalineOverride,
                        ecRate: ECR,
                        totalAmount: totalEC,
                        formattedAmount: `₹${totalEC.toLocaleString('en-IN')}`
                    },
                    notes: [
                        "These Environmental Compensation charges varies with the changes in the selected category of block w.e.f 1st January of each year.",
                        "Final calculation of Environmental Compensation will be based on prevailing category of block wef 1st January of each year for the period of illegal groundwater extraction.",
                        "Final calculated Enivronmental Compensation will be communicated and NOC will be issued subject to payment of same.",
                        "For Saline Water, EC Rates for Safe category shall be applied, irrespective of actual category of Block/Sub District."
                    ]
                },
                message: "Environmental Compensation calculated successfully"
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PublicController();
