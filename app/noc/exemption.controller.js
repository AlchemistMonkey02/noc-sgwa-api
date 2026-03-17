const NOCApplication = require("./noc-application.model");
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

        const newApp = new NOCApplication({
            applicationId: uuidv4(),
            applicationNumber: `EXP-${Date.now()}`,
            userId: req.user?.id || req.user?._id, // Link to user if logged in
            companyId: req.company?._id || req.userCompany?._id, // Link to company if available
            applicationType: data.applicationType || "Agriculture Activities",
            applicationSubType: data.applicationSubType || "Ground Water Requirement for Agriculture",
            waterQualityType: data.waterQualityType || "Fresh Water",
            isExempted: true,
            exemptionEligible: eligible,
            exemptionDetails: data, // Store the raw form for the details view

            // Map common fields so the Officer tables don't break
            projectDetails: {
                projectName: data.ownerDetails?.ownerName || "Agricultural Exemption",
                applicantName: data.ownerDetails?.ownerName || "Unknown",
                mobile: data.ownerDetails?.ownerPhone,
                email: data.ownerDetails?.ownerEmail
            },
            location: {
                stateId: data.ownerDetails?.state || "RAJASTHAN",
                districtId: data.ownerDetails?.district || "JAIPUR",
                blockId: data.agriculturalDetails?.assessmentUnitBlockTehsil || "Unknown",
                village: data.agriculturalDetails?.gramPanchayatName || "Unknown",
                pincode: data.ownerDetails?.pinCode || "Unknown",
            },

            status: "SUBMITTED"
        });

        await newApp.save();

        res.status(201).json({
            success: true,
            applicationId: newApp.applicationId, // Use correct ID property
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
        const mongoose = require('mongoose');

        const query = { $or: [{ applicationId: applicationId }] };
        if (mongoose.Types.ObjectId.isValid(applicationId)) {
            query.$or.push({ _id: applicationId });
        }

        const application = await NOCApplication.findOne(query);

        if (!application || !application.isExempted) {
            return res.status(404).json({ success: false, message: "Exempted Application not found" });
        }

        res.status(200).json({
            success: true,
            data: application,
            message: "Application retrieved successfully"
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.submitApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const mongoose = require('mongoose');

        const query = { $or: [{ applicationId: applicationId }] };
        if (mongoose.Types.ObjectId.isValid(applicationId)) {
            query.$or.push({ _id: applicationId });
        }

        const application = await NOCApplication.findOne(query);

        if (!application || !application.isExempted) {
            return res.status(404).json({ success: false, message: "Exempted Application not found" });
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

        res.status(200).json({
            success: true,
            data: {
                nextSteps: application.exemptionEligible ? "Exemption Certificate Generated" : "Submit supporting documents for review."
            },
            message: "Application submitted successfully"
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

        res.status(200).json({
            success: true,
            data: {
                isExempt: exemptionResult.isExempt,
                exemptionResult,
                displayConfig
            },
            message: "Eligibility check completed"
        });
    } catch (error) {
        console.error("Check Eligibility Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCertificate = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const mongoose = require('mongoose');

        const query = { $or: [{ applicationId: applicationId }] };
        if (mongoose.Types.ObjectId.isValid(applicationId)) {
            query.$or.push({ _id: applicationId });
        }

        const application = await NOCApplication.findOne(query);

        if (!application || !application.isExempted) {
            return res.status(404).json({ success: false, message: "Exempted Application not found" });
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
            certificateId: `EXEMPT-NOC-${application.applicationNumber || application.applicationId.substring(0, 8).toUpperCase()}`,
            issueDate: new Date(),
            validAndEffectiveFrom: new Date(),
            applicantName: application.projectDetails?.applicantName || "N/A",
            projectLocation: application.location?.blockId || "Specified Location",
            exemptionCategory: "Agricultural Activities", // Dynamic based on rules if needed
            status: "ACTIVE",
            message: "This is a computer-generated exemption certificate."
        };

        res.status(200).json({
            success: true,
            data: certificate,
            message: "Certificate generated successfully"
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

        res.status(200).json({
            success: true,
            data: {
                utilizationTypes,
                utilizationPurposes
            },
            message: "Configuration retrieved successfully"
        });
    } catch (error) {
        console.error("Get Config Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
