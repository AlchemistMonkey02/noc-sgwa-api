const Joi = require("joi");

// Register validation
const registerSchema = Joi.object({
    // Applicant Information - NEW FIELDS
    title: Joi.string()
        .valid("Mr", "Mrs", "Ms", "Dr", "Prof")
        .required()
        .messages({
            "any.only": "Please select a valid title",
            "any.required": "Title is required",
        }),

    firstName: Joi.string().trim().min(2).max(100).required()
        .messages({
            "string.empty": "First name is required",
            "string.min": "First name must be at least 2 characters",
        }),

    lastName: Joi.string().trim().min(2).max(100).required()
        .messages({
            "string.empty": "Last name is required",
            "string.min": "Last name must be at least 2 characters",
        }),

    dateOfBirth: Joi.date()
        .max("now")
        .required()
        .messages({
            "date.base": "Please provide a valid date of birth",
            "date.max": "Date of birth cannot be in the future",
            "any.required": "Date of birth is required",
        }),

    gender: Joi.string()
        .valid("MALE", "FEMALE", "OTHER")
        .required()
        .messages({
            "any.only": "Please select a valid gender",
            "any.required": "Gender is required",
        }),

    // ID Proof Information - NEW FIELDS
    uidNumber: Joi.string()
        .pattern(/^[0-9]{12}$/)
        .optional()
        .messages({
            "string.pattern.base": "UID/Aadhaar must be 12 digits",
        }),

    idProofType: Joi.string()
        .valid("AADHAAR", "PAN", "VOTER_ID", "PASSPORT", "DRIVING_LICENSE")
        .required()
        .messages({
            "any.required": "ID proof type is required",
        }),

    idProofNumber: Joi.string().trim().required()
        .messages({
            "string.empty": "ID proof number is required",
        }),

    // Contact Information
    email: Joi.string().email().lowercase().trim().required()
        .messages({
            "string.email": "Please provide a valid email address",
            "string.empty": "Email is required",
        }),

    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
        .messages({
            "string.pattern.base": "Please provide a valid 10-digit Indian phone number",
            "string.empty": "Phone number is required",
        }),

    // Communication Address - NEW STRUCTURE
    communicationAddress: Joi.object({
        addressLine1: Joi.string().required()
            .messages({ "string.empty": "Address Line 1 is required" }),
        addressLine2: Joi.string().allow("").optional(),
        addressLine3: Joi.string().allow("").optional(),
        state: Joi.string().required()
            .messages({ "string.empty": "State is required" }),
        district: Joi.string().required()
            .messages({ "string.empty": "District is required" }),
        subDistrict: Joi.string().allow("").optional(),
        pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).required()
            .messages({
                "string.empty": "Pincode is required",
                "string.pattern.base": "Please provide a valid 6-digit pincode",
            }),
    }).required(),

    // Login Credentials - NEW FIELDS
    username: Joi.string()
        .alphanum()
        .min(4)
        .max(30)
        .lowercase()
        .optional()
        .messages({
            "string.alphanum": "Username must contain only letters and numbers",
            "string.min": "Username must be at least 4 characters",
        }),

    password: Joi.string().min(6).required()
        .messages({
            "string.min": "Password must be at least 6 characters long",
            "string.empty": "Password is required",
        }),

    confirmPassword: Joi.string().valid(Joi.ref("password")).required()
        .messages({
            "any.only": "Passwords do not match",
            "string.empty": "Confirm password is required",
        }),

    securityQuestion: Joi.string().optional(),
    securityAnswer: Joi.string().when("securityQuestion", {
        is: Joi.exist(),
        then: Joi.string().required(),
        otherwise: Joi.optional(),
    }),

    // Organization (optional - keep for backward compatibility)
    organizationName: Joi.string().trim().max(255).optional(),

    organizationType: Joi.string().valid("INDIVIDUAL", "COMPANY", "GOVERNMENT", "NGO").optional(),

    panNumber: Joi.string().uppercase().optional(),

    gstNumber: Joi.string().uppercase().optional(),

    //Legacy address (keeping for backward compatibility)
    address: Joi.object({
        line1: Joi.string().trim().max(255).optional(),
        line2: Joi.string().trim().max(255).optional(),
        city: Joi.string().trim().max(100).optional(),
        state: Joi.string().trim().max(100).optional(),
        pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).optional()
            .messages({
                "string.pattern.base": "Please provide a valid 6-digit pincode",
            }),
    }).optional(),

    captcha: Joi.string().optional(), // For future captcha implementation
});

// Step 1: Applicant Information validation
const registerStep1Schema = Joi.object({
    title: Joi.string()
        .valid("Mr", "Mrs", "Ms", "Dr", "Prof")
        .required()
        .messages({
            "any.only": "Please select a valid title",
            "any.required": "Title is required",
        }),

    applicantName: Joi.string().trim().min(2).max(200).required()
        .messages({
            "string.empty": "Applicant name is required",
            "string.min": "Name must be at least 2 characters",
        }),

    dateOfBirth: Joi.date()
        .max("now")
        .required()
        .messages({
            "date.base": "Please provide a valid date of birth",
            "date.max": "Date of birth cannot be in the future",
            "any.required": "Date of birth is required",
        }),

    gender: Joi.string()
        .valid("MALE", "FEMALE", "OTHER")
        .required()
        .messages({
            "any.only": "Please select a valid gender",
            "any.required": "Gender is required",
        }),

    uidNumber: Joi.string()
        .pattern(/^[0-9]{12}$/)
        .allow("", null)
        .optional()
        .messages({
            "string.pattern.base": "UID/Aadhaar must be 12 digits",
        }),

    idProofType: Joi.string()
        .valid("AADHAAR", "PAN", "VOTER_ID", "PASSPORT", "DRIVING_LICENSE")
        .required()
        .messages({
            "any.required": "ID proof type is required",
        }),

    idProofNumber: Joi.string().trim().required()
        .messages({
            "string.empty": "ID proof number is required",
        }),

    mobileNumber: Joi.string().pattern(/^[6-9]\d{9}$/).required()
        .messages({
            "string.pattern.base": "Please provide a valid 10-digit Indian mobile number",
            "string.empty": "Mobile number is required",
        }),

    emailId: Joi.string().email().lowercase().trim().required()
        .messages({
            "string.email": "Please provide a valid email address",
            "string.empty": "Email is required",
        }),
});

// Step 2: Communication Address validation
const registerStep2Schema = Joi.object({
    addressLine1: Joi.string().required()
        .messages({ "string.empty": "Address Line 1 is required" }),
    addressLine2: Joi.string().allow("").optional(),
    addressLine3: Joi.string().allow("").optional(),
    state: Joi.string().required()
        .messages({ "string.empty": "State is required" }),
    district: Joi.string().required()
        .messages({ "string.empty": "District is required" }),
    subDistrict: Joi.string().allow("").optional(),
    pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).required()
        .messages({
            "string.empty": "Pincode is required",
            "string.pattern.base": "Please provide a valid 6-digit pincode",
        }),
});

// Step 3: Login Credentials validation
const registerStep3Schema = Joi.object({
    preferredUsername: Joi.string()
        .alphanum()
        .min(4)
        .max(30)
        .lowercase()
        .required()
        .messages({
            "string.alphanum": "Username must contain only letters and numbers",
            "string.min": "Username must be at least 4 characters",
            "string.empty": "Username is required",
        }),

    password: Joi.string().min(6).required()
        .messages({
            "string.min": "Password must be at least 6 characters long",
            "string.empty": "Password is required",
        }),

    confirmPassword: Joi.string().valid(Joi.ref("password")).required()
        .messages({
            "any.only": "Passwords do not match",
            "string.empty": "Confirm password is required",
        }),

    securityQuestion: Joi.string().optional(),
    securityAnswer: Joi.string().when("securityQuestion", {
        is: Joi.exist(),
        then: Joi.string().required(),
        otherwise: Joi.optional(),
    }),
});

// Login validation
const loginSchema = Joi.object({
    username: Joi.string().required()
        .messages({
            "string.empty": "Email or phone is required",
        }),

    password: Joi.string().required()
        .messages({
            "string.empty": "Password is required",
        }),

    userType: Joi.string().valid("APPLICANT", "DGO", "SGWA", "RSGWA", "ENFORCEMENT").optional(),

    captcha: Joi.string().optional(),
});

// Forgot password validation
const forgotPasswordSchema = Joi.object({
    userId: Joi.string().required()
        .messages({ "string.empty": "User ID is required" }),
    
    email: Joi.string().email().required()
        .messages({
            "string.email": "Please provide a valid email address",
            "string.empty": "Email is required",
        }),

    mobileNumber: Joi.string().pattern(/^[6-9]\d{9}$/).required()
        .messages({
            "string.pattern.base": "Please provide a valid 10-digit Indian mobile number",
            "string.empty": "Mobile number is required",
        }),

    userType: Joi.string().valid("APPLICANT", "DGO", "SGWA", "RSGWA", "ENFORCEMENT").required()
        .messages({
            "any.only": "Please select a valid user type",
            "any.required": "User type is required",
        }),

    captcha: Joi.string().optional(),
});

// Reset password validation
const resetPasswordSchema = Joi.object({
    token: Joi.string().required()
        .messages({
            "string.empty": "Reset token is required",
        }),

    newPassword: Joi.string().min(6).required()
        .messages({
            "string.min": "Password must be at least 6 characters long",
            "string.empty": "New password is required",
        }),

    confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required()
        .messages({
            "any.only": "Passwords do not match",
            "string.empty": "Confirm password is required",
        }),
});

// Update profile validation
const updateProfileSchema = Joi.object({
    firstName: Joi.string().trim().min(2).max(100).optional(),
    lastName: Joi.string().trim().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    organizationName: Joi.string().trim().max(255).optional(),
    address: Joi.object({
        line1: Joi.string().trim().max(255).optional(),
        line2: Joi.string().trim().max(255).optional(),
        city: Joi.string().trim().max(100).optional(),
        state: Joi.string().trim().max(100).optional(),
        pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).optional(),
    }).optional(),
});

// Middleware to validate request body
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Return all errors
            stripUnknown: true, // Remove unknown fields
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

        // Replace req.body with validated value
        req.body = value;
        next();
    };
};

// Middleware to validate step data (nested in req.body.data)
const validateStepData = (schema) => {
    return (req, res, next) => {
        // req.body.data contains the actual fields to validate
        const dataToValidate = req.body.data || {};

        const { error, value } = schema.validate(dataToValidate, {
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

        // Replace req.body.data with validated value
        req.body.data = value;
        next();
    };
};

module.exports = {
    validateRegister: validate(registerSchema),
    validateLogin: validate(loginSchema),
    validateForgotPassword: validate(forgotPasswordSchema),
    validateResetPassword: validate(resetPasswordSchema),
    validateStep1: validateStepData(registerStep1Schema),
    validateStep2: validateStepData(registerStep2Schema),
    validateStep3: validateStepData(registerStep3Schema),
};
