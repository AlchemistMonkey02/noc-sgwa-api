const Joi = require("joi");

// Create/Update NOC Application
const nocApplicationSchema = Joi.object({
    applicationType: Joi.string().valid("NEW", "RENEWAL", "AMENDMENT").required(),

    location: Joi.object({
        stateId: Joi.string().required(),
        districtId: Joi.string().required(),
        blockId: Joi.string().required(),
        village: Joi.string().optional(),
        address: Joi.string().required(),
        pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).optional(),
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional(),
    }).required(),

    projectDetails: Joi.object({
        projectName: Joi.string().min(3).max(200).required(),
        industryType: Joi.string().optional(),
        projectDescription: Joi.string().max(1000).optional(),
        landArea: Joi.number().positive().optional(),
        builtUpArea: Joi.number().positive().optional(),
    }).required(),

    waterRequirement: Joi.object({
        purpose: Joi.string().required(),
        dailyRequirement: Joi.number().positive().required(),
        sourceType: Joi.string().valid("BOREWELL", "TUBE_WELL", "OPEN_WELL").required(),
        numberOfBorewells: Joi.number().integer().positive().optional(),
        depth: Joi.number().positive().optional(),
        pumpCapacity: Joi.number().positive().optional(),
    }).required(),

    documents: Joi.array().items(Joi.string()).optional(),
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
    validateNOCApplication: validate(nocApplicationSchema),
    validateQueryResponse: validate(queryResponseSchema),
    validateRaiseQuery: validate(raiseQuerySchema),
    validateApprove: validate(approveApplicationSchema),
    validateReject: validate(rejectApplicationSchema),
};
