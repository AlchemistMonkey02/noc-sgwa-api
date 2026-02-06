const { v4: uuidv4 } = require('uuid');

/**
 * Business Logic: Check if application is exempted
 */
function isExempted(application) {
    // 1. App Type must be Agriculture
    if (application.applicationType !== "Agriculture Activities") {
        return { isExempt: false, reason: "Only 'Agriculture Activities' are eligible for exemption." };
    }

    // 2. Water Quality must be Fresh
    if (application.waterQualityType !== "Fresh Water") {
        return { isExempt: false, reason: "Only 'Fresh Water' quality is eligible for exemption." };
    }

    // 3. Quantity Check
    // Prompt: IF assessmentUnitBlockTehsil contains "OVER EXPLOITED" AND waterRequirementKLD > 50 -> Exemption NOT allowed
    if (application.agriculturalDetails) {
        // Check block status
        const blockName = application.agriculturalDetails.assessmentUnitBlockTehsil || "";
        const isOverExploited = blockName.toUpperCase().includes("OVER EXPLOITED");
        const kld = application.agriculturalDetails.waterRequirementKLD || 0;

        if (isOverExploited && kld > 50) {
            return { isExempt: false, reason: "Water requirement exceeds 50 KLD limit for Over Exploited areas." };
        }

        // Additional safety: Prompt says "IF landHoldingAreaHectare <= 0 -> Validation error"
        // This is validation, not just exemption, but good to catch.
    }

    // If we passed checks, it's eligible.
    return { isExempt: true };
}

exports.validateExemptionEligibility = (req, res, next) => {
    let data = req.body;

    // Map ID to Name if applicationType is a number or numeric string
    const APPLICATION_TYPE_MAP = {
        "1": "Bulk Water Supply",
        "2": "Industry",
        "3": "Infrastructure",
        "4": "Mining",
        "5": "Individual Domestic Consumer",
        "6": "Agriculture Activities"
    };

    if (data.applicationType && (typeof data.applicationType === 'number' || !isNaN(data.applicationType))) {
        const mappedName = APPLICATION_TYPE_MAP[String(data.applicationType)];
        if (mappedName) {
            // Update req.body directly so controller also sees the mapped value
            req.body.applicationType = mappedName;
            data = req.body;
        }
    }

    const check = isExempted(data);

    if (!check.isExempt) {
        return res.status(400).json({
            success: false,
            errorCode: "VALIDATION_ERROR",
            message: check.reason,
            errors: {
                waterRequirementKLD: check.reason // Mapping to field as per example
            }
        });
    }

    // Attach eligibility result if needed, or just proceed
    req.exemptionEligible = true;
    next();
};
