const Joi = require("joi");

// Register company validation
const registerCompanySchema = Joi.object({
    companyName: Joi.string().trim().min(2).max(255).required()
        .messages({
            "string.empty": "Company name is required",
            "string.min": "Company name must be at least 2 characters",
        }),

    companyType: Joi.string()
        .valid("PRIVATE_LIMITED", "PUBLIC_LIMITED", "PARTNERSHIP", "PROPRIETORSHIP", "LLP", "GOVERNMENT", "NGO", "TRUST", "SOCIETY", "COOPERATIVE")
        .required()
        .messages({
            "any.only": "Invalid company type",
            "any.required": "Company type is required",
        }),

    industryType: Joi.string().required()
        .messages({ "string.empty": "Industry type is required" }),

    companyRegistrationNumber: Joi.string().trim().uppercase().optional(),

    cinNumber: Joi.string().trim().uppercase().optional(),

    gstNumber: Joi.string()
        .uppercase()
        .optional(),

    panNumber: Joi.string()
        .uppercase()
        .optional(),

    tanNumber: Joi.string().trim().uppercase().optional(),

    email: Joi.string().email().lowercase().trim().required()
        .messages({
            "string.email": "Please provide a valid company email address",
            "any.required": "Company email is required",
        }),

    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
        .messages({
            "string.pattern.base": "Please provide a valid 10-digit Indian phone number",
            "any.required": "Company phone number is required",
        }),

    landline: Joi.string().pattern(/^[0-9]\d{9,11}$/).optional()
        .messages({
            "string.pattern.base": "Please provide a valid landline number (STD code + number)",
        }),

    alternatePhone: Joi.string().pattern(/^[6-9]\d{9}$/).optional()
        .messages({
            "string.pattern.base": "Please provide a valid 10-digit Indian phone number",
        }),

    website: Joi.string().uri().optional(),

    registeredAddress: Joi.object({
        addressLine1: Joi.string().required()
            .messages({ "string.empty": "Address Line 1 is required" }),
        addressLine2: Joi.string().allow("").optional(),
        addressLine3: Joi.string().allow("").optional(),
        state: Joi.string().required()
            .messages({ "string.empty": "State is required" }),
        district: Joi.string().required()
            .messages({ "string.empty": "District is required" }),
        city: Joi.string().allow("").optional(),
        pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).required()
            .messages({
                "string.empty": "Pincode is required",
                "string.pattern.base": "Please provide a valid 6-digit pincode",
            }),
    }).required(),

    sameAsRegistered: Joi.boolean().optional(),

    communicationAddress: Joi.object({
        addressLine1: Joi.string().allow("").optional(),
        addressLine2: Joi.string().allow("").optional(),
        addressLine3: Joi.string().allow("").optional(),
        state: Joi.string().allow("").optional(),
        district: Joi.string().allow("").optional(),
        city: Joi.string().allow("").optional(),
        pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).allow("").optional(),
    }).optional(),

    authorizedPerson: Joi.object({
        name: Joi.string().required()
            .messages({ "string.empty": "Authorized person name is required" }),
        designation: Joi.string().required()
            .messages({ "string.empty": "Designation is required" }),
        email: Joi.string().email().required()
            .messages({ "any.required": "Authorized person email is required" }),
        phone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
            .messages({ "any.required": "Authorized person phone is required" }),
        aadhaarNumber: Joi.string().pattern(/^[0-9]{12}$/).optional(),
    }).required(),

    numberOfEmployees: Joi.number().min(0).optional(),
    annualTurnover: Joi.number().min(0).optional(),
    dateOfIncorporation: Joi.date().max("now").optional(),
    incorporationId: Joi.string().trim().optional(),
    remarks: Joi.string().allow("").optional(),
});

// Update company validation
const updateCompanySchema = Joi.object({
    companyName: Joi.string().trim().min(2).max(255).optional(),
    companyType: Joi.string().valid("PRIVATE_LIMITED", "PUBLIC_LIMITED", "PARTNERSHIP", "PROPRIETORSHIP", "LLP", "GOVERNMENT", "NGO", "TRUST", "SOCIETY", "COOPERATIVE").optional(),
    industryType: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    alternatePhone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    website: Joi.string().uri().optional(),
    communicationAddress: Joi.object({
        addressLine1: Joi.string().optional(),
        addressLine2: Joi.string().optional(),
        addressLine3: Joi.string().optional(),
        state: Joi.string().optional(),
        district: Joi.string().optional(),
        city: Joi.string().optional(),
        pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).optional(),
    }).optional(),
    authorizedPerson: Joi.object({
        name: Joi.string().optional(),
        designation: Joi.string().optional(),
        email: Joi.string().email().optional(),
        phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
        aadhaarNumber: Joi.string().pattern(/^[0-9]{12}$/).optional(),
    }).optional(),
    numberOfEmployees: Joi.number().min(0).optional(),
    annualTurnover: Joi.number().min(0).optional(),
    incorporationId: Joi.string().trim().optional(),
    remarks: Joi.string().optional(),
});

// Middleware to validate request body
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
    validateRegisterCompany: validate(registerCompanySchema),
    validateUpdateCompany: validate(updateCompanySchema),
};
