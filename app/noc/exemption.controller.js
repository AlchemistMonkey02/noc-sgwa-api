const NocExemptionApplication = require("./exemption.model");
const { v4: uuidv4 } = require('uuid');
const { checkExemption, getExemptionDisplayConfig } = require('../../exemptionRules');

/**
 * Business Logic: Check if application is exempted
 */
function isExempted(application) {
    // 1. App Type must be Agriculture
    if (application.applicationType !== "Agriculture Activities") {
        return false;
    }

    // 2. Water Quality must be Fresh
    if (application.waterQualityType !== "Fresh Water") {
        return false;
    }

    // 3. Quantity Check
    // Logic: <= 50 KLD is generally exempted?
    // Prompt says: IF waterRequirementKLD <= 50 -> return true.
    if (application.agriculturalDetails && application.agriculturalDetails.waterRequirementKLD <= 50) {
        return true;
    }

    return false;
}

/**
 * Validation Logic based on prompts
 */
function validateApplication(data) {
    const errors = {};

    // Core Rules
    if (data.applicationType !== "Agriculture Activities") {
        errors.applicationType = "Type must be 'Agriculture Activities' for this exemption form.";
    }

    if (data.waterQualityType !== "Fresh Water") {
        errors.waterQualityType = "Only 'Fresh Water' is eligible for this exemption.";
    }

    // Usage Check
    if (data.groundWaterUsage && !data.groundWaterUsage.drinkingDomestic && !data.groundWaterUsage.agricultureUse) {
        errors.groundWaterUsage = "Must select at least one usage (Drinking/Domestic or Agriculture).";
    }

    // Agriculture Specific
    if (data.agriculturalDetails) {
        const { assessmentUnitBlockTehsil, waterRequirementKLD, landHoldingAreaHectare } = data.agriculturalDetails;

        // "OVER EXPLOITED" check
        if (assessmentUnitBlockTehsil && assessmentUnitBlockTehsil.toUpperCase().includes("OVER EXPLOITED")) {
            if (waterRequirementKLD > 50) {
                errors.waterRequirementKLD = "Exceeds exemption limit (50 KLD) in OVER EXPLOITED area.";
            }
        }

        if (landHoldingAreaHectare <= 0) {
            errors.landHoldingAreaHectare = "Land area must be greater than 0.";
        }
    }

    return Object.keys(errors).length > 0 ? errors : null;
}

// REST API Methods

exports.createApplication = async (req, res) => {
    try {
        const data = req.body;

        // 1. Validate
        const contentErrors = validateApplication(data);
        if (contentErrors) {
            // NOTE: Prompt wants a specific error format?
            // "VALIDATION_ERROR"
            return res.status(400).json({
                success: false,
                errorCode: "VALIDATION_ERROR",
                errors: contentErrors
            });
        }

        // 2. Check Exemption Eligibility
        const eligible = isExempted(data);

        // 3. Create Record
        const newApp = new NocExemptionApplication({
            ...data,
            exemptionEligible: eligible,
            status: "SUBMITTED"
        });

        await newApp.save();

        res.status(201).json({
            success: true,
            applicationId: newApp._id,
            status: newApp.status,
            exemptionEligible: newApp.exemptionEligible,
            message: "Application saved successfully"
        });

    } catch (error) {
        console.error("Create Exemption Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.getApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const application = await NocExemptionApplication.findById(applicationId);

        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        res.json({
            success: true,
            data: application
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.submitApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const application = await NocExemptionApplication.findById(applicationId);

        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        if (application.status !== "DRAFT") {
            return res.status(400).json({ success: false, message: "Application is already submitted." });
        }

        // Determine final status based on eligibility
        // If eligible -> APPROVED (Auto-approve? Prompt implies flow DRAFT -> SUBMITTED)
        // "Return next steps (documents, approval flow)"
        // The status flow says: DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED / REJECTED
        // If it's an EXEMPTION, maybe it goes straight to Approved if strict rules met?
        // For now, I'll set to SUBMITTED.

        application.status = "SUBMITTED";
        await application.save();

        res.json({
            success: true,
            message: "Application submitted successfully",
            nextSteps: application.exemptionEligible ? "Exemption Certificate Generated" : "Submit supporting documents for review."
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.checkEligibility = async (req, res) => {
    try {
        const formData = req.body;

        // Use the comprehensive rules engine
        const exemptionResult = checkExemption(formData);
        const displayConfig = getExemptionDisplayConfig(exemptionResult);

        res.json({
            success: true,
            isExempt: exemptionResult.isExempt,
            exemptionResult,
            displayConfig
        });
    } catch (error) {
        console.error("Check Eligibility Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCertificate = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const application = await NocExemptionApplication.findById(applicationId);

        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        if (!application.exemptionEligible) {
            return res.status(400).json({
                success: false,
                message: "Application is not eligible for exemption certificate."
            });
        }

        // Allow if SUBMITTED or APPROVED.
        if (!["SUBMITTED", "APPROVED"].includes(application.status)) {
            return res.status(400).json({
                success: false,
                message: `Application status is ${application.status}. Must be SUBMITTED to generate certificate.`
            });
        }

        // Generate Mock Certificate Data
        const certificate = {
            certificateId: `EXEMPT-NOC-${application.applicationId || applicationId.substring(0, 8).toUpperCase()}`,
            issueDate: new Date(),
            validAndEffectiveFrom: new Date(),
            applicantName: application.nameOfApplicant || "N/A",
            projectLocation: application.agriculturalDetails?.assessmentUnitBlockTehsil || "Specified Location",
            exemptionCategory: "Agricultural Activities", // Dynamic based on rules if needed
            status: "ACTIVE",
            message: "This is a computer-generated exemption certificate."
        };

        res.json({
            success: true,
            certificate
        });

    } catch (error) {
        console.error("Get Certificate Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getConfig = async (req, res) => {
    try {
        // Defined utilization types for Exemption Form
        const utilizationTypes = [
            { code: "AGR", name: "Agriculture Activities", isExempt: true },
            { code: "DOM_IND", name: "Individual Domestic Consumer", isExempt: true },
            { code: "IND", name: "Industry", isExempt: false }, // Allowed but conditioned
            { code: "INF", name: "Infrastructure", isExempt: false },
            { code: "MIN", name: "Mining", isExempt: false },
            { code: "BLK", name: "Bulk Water Supply", isExempt: false }
        ];

        // Purpose (New/Existing)
        const utilizationPurposes = [
            { code: "NEW", name: "New" },
            { code: "EXISTING", name: "Existing" }
        ];

        res.json({
            success: true,
            data: {
                utilizationTypes,
                utilizationPurposes
            }
        });
    } catch (error) {
        console.error("Get Config Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
