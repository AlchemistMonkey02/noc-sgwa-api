const Joi = require("joi");

// Draft create/update (section-wise flow): allow partial payloads
// NOTE: Full validation should happen at submit-time (or via /validate).
const nocDraftSchema = Joi.object({
    applicationType: Joi.string().optional(),
    applicationSubType: Joi.string().optional(),
    projectType: Joi.string().optional(),
    waterQualityType: Joi.string().optional(),
    groundWaterUtilizationFor: Joi.string().optional(),
    dateOfCommencement: Joi.date().allow("", null).optional(),
    existingNOCStatus: Joi.string().optional(),
    oldNOCNumber: Joi.any().optional(),

    location: Joi.object({
        stateId: Joi.string().optional(),
        districtId: Joi.string().optional(),
        blockId: Joi.string().optional(),
        tehsil: Joi.string().optional(),
        assessmentUnit: Joi.string().optional(),
        relevantBlocks: Joi.string().optional(),
        blockCategory: Joi.string().optional(),
        village: Joi.string().optional(),
        address: Joi.string().optional(),
        pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).optional(),
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional(),
        geology: Joi.string().optional(),
    }).optional(),

    projectDetails: Joi.object().unknown(true).optional(),
    digitalFlowMeter: Joi.object().unknown(true).optional(),
    communicationAddress: Joi.object().unknown(true).optional(),
    waterRequirement: Joi.object().unknown(true).optional(),
    groundWaterStructures: Joi.array().items(Joi.object().unknown(true)).optional(),
    waterRequirementBreakup: Joi.array().items(Joi.object().unknown(true)).optional(),
    drinkingDomesticUse: Joi.object().unknown(true).optional(),
    stpEtpDetails: Joi.object().unknown(true).optional(),
    conservationMeasures: Joi.object().unknown(true).optional(),
    hydrogeology: Joi.object().unknown(true).optional(),
    feeDetails: Joi.object().unknown(true).optional(),
    documents: Joi.array().items(Joi.object().unknown(true)).optional(),

    applicationId: Joi.string().optional(), // For updates
}).unknown(true);

// Create/Update NOC Application
const nocApplicationSchema = Joi.object({
    applicationType: Joi.string().required(),
    applicationSubType: Joi.string().required(),
    projectType: Joi.string().optional(),
    waterQualityType: Joi.string().required(),
    groundWaterUtilizationFor: Joi.string().valid("NEW", "EXISTING").required(),
    dateOfCommencement: Joi.date().allow("", null).optional(),
    existingNOCStatus: Joi.string().valid("YES", "NO").required(),
    oldNOCNumber: Joi.when("existingNOCStatus", {
        is: "YES",
        then: Joi.string().required(),
        otherwise: Joi.string().optional().allow(null, "")
    }),

    // Location - Enhanced
    location: Joi.object({
        stateId: Joi.string().required(),
        districtId: Joi.string().required(),
        blockId: Joi.string().required(),
        tehsil: Joi.string().optional(),
        assessmentUnit: Joi.string().optional(),
        relevantBlocks: Joi.string().optional(),
        blockCategory: Joi.string().optional(),
        village: Joi.string().optional(),
        address: Joi.string().required(),
        pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).optional(),
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional(),
        geology: Joi.string().optional(),
    }).optional(),

    // Project Details - Enhanced
    projectDetails: Joi.object({
        projectName: Joi.string().min(3).max(200).optional(),
        industryType: Joi.string().optional(),
        projectDescription: Joi.string().max(1000).optional(),
        landArea: Joi.number().positive().optional(),
        builtUpArea: Joi.number().positive().optional(),
        openLandArea: Joi.number().positive().optional(),

        // New Applicant Fields
        applicantName: Joi.string().optional(),
        organizationName: Joi.string().optional(),
        organizationType: Joi.string().optional(),
        designation: Joi.string().optional(),
        email: Joi.string().email().optional(),
        mobile: Joi.string().pattern(/^[0-9]{10}$/).optional(),
        aadhaarNumber: Joi.string().optional(),
        panNumber: Joi.string().optional(),

        // Status
        projectStatus: Joi.string().valid('NEW', 'EXISTING', 'EXPANSION').optional(),
        nicCode: Joi.string().optional(),

        // Wetland
        isNearWetland: Joi.boolean().optional(),
        wetlandName: Joi.string().optional().allow(''),
        wetlandDistance: Joi.number().optional(),

        // Greenbelt
        totalLandArea: Joi.number().optional(),
        greenBeltArea: Joi.number().optional(),
        greenBeltPercentage: Joi.number().optional(),

        isMSME: Joi.boolean().optional(),
        msmeDetails: Joi.object({
            category: Joi.string().valid("MICRO", "SMALL", "MEDIUM").when("...isMSME", {
                is: true,
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            registrationNumber: Joi.string().when("...isMSME", {
                is: true,
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            registrationDate: Joi.date().optional(),
            certificateDocument: Joi.string().optional()
        }).optional(),

        greenBelt: Joi.object().unknown(true).optional()
    }).optional(),

    // NEW: Digital Flow Meter
    digitalFlowMeter: Joi.object({
        meterType: Joi.string().optional(),
        manufacturer: Joi.string().optional(),
        modelNumber: Joi.string().optional(),
        serialNumber: Joi.string().optional(),
        bisStandards: Joi.string().optional(),
        calibrationDate: Joi.date().optional(),
        telemetry: Joi.object({
            enabled: Joi.boolean().optional(),
            serviceProvider: Joi.string().optional(),
            proposedInstallationDate: Joi.date().optional()
        }).optional(),
        complianceCommitments: Joi.object().unknown(true).optional()
    }).optional(),

    // NEW: Communication Address
    communicationAddress: Joi.object({
        addressLine1: Joi.string().optional(),
        addressLine2: Joi.string().optional(),
        state: Joi.string().optional(),
        district: Joi.string().optional(),
        pincode: Joi.string().optional(),
        sameAsProjectAddress: Joi.boolean().optional()
    }).optional(),

    waterRequirement: Joi.object({
        purpose: Joi.string().required(),
        dailyRequirement: Joi.number().positive().required(),
        sourceType: Joi.string().valid("BOREWELL", "TUBE_WELL", "OPEN_WELL").required(),
        numberOfBorewells: Joi.number().integer().positive().optional(),
        depth: Joi.number().positive().optional(),
        pumpCapacity: Joi.number().positive().optional(),
    }).optional(),

    // Arrays and other sections
    groundWaterStructures: Joi.array().items(Joi.object().unknown(true)).optional(),
    waterRequirementBreakup: Joi.array().items(Joi.object().unknown(true)).optional(),
    drinkingDomesticUse: Joi.object().unknown(true).optional(),
    stpEtpDetails: Joi.object().unknown(true).optional(),
    conservationMeasures: Joi.object().unknown(true).optional(),
    hydrogeology: Joi.object().unknown(true).optional(),
    feeDetails: Joi.object({
        paymentReceiptDocumentId: Joi.string().optional()
    }).unknown(true).optional(),

    documents: Joi.array().items(
        Joi.object({
            documentType: Joi.string().required(),
            documentId: Joi.string().required(),
            fileName: Joi.string().optional()
        }).unknown(true)
    ).optional(),

    applicationId: Joi.string().optional(), // For updates
});

// Query response
const queryResponseSchema = Joi.object({
    response: Joi.string().min(10).max(2000).required(),
});

// Raise query
const raiseQuerySchema = Joi.object({
    query: Joi.string().min(10).max(2000).required(),
});

// Approve application
const approveApplicationSchema = Joi.object({
    approvedWaterQuantity: Joi.number().positive().required(),
    validityYears: Joi.number().integer().min(1).max(5).required(),
    conditions: Joi.array().items(Joi.string()).optional(),
    restrictions: Joi.array().items(Joi.string()).optional(),
});

// Reject application
const rejectApplicationSchema = Joi.object({
    rejectionReason: Joi.string().min(10).max(500).required(),
});

// Validator middleware
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errors = error.details.map((detail) => detail.message);
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Validation failed",
                    details: errors,
                },
            });
        }

        req.body = value;
        next();
    };
};

module.exports = {
    validateNOCDraft: validate(nocDraftSchema),
    validateNOCApplication: validate(nocApplicationSchema),
    validateQueryResponse: validate(queryResponseSchema),
    validateRaiseQuery: validate(raiseQuerySchema),
    validateApprove: validate(approveApplicationSchema),
    validateReject: validate(rejectApplicationSchema),
};
