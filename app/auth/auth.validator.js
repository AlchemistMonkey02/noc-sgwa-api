const Joi = require("joi");

// Register validation
const registerSchema = Joi.object({
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

    organizationName: Joi.string().trim().max(255).optional(),

    organizationType: Joi.string().valid("INDIVIDUAL", "COMPANY", "GOVERNMENT", "NGO").optional(),

    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).uppercase().optional()
        .messages({
            "string.pattern.base": "Please provide a valid PAN number (e.g., ABCDE1234F)",
        }),

    gstNumber: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).uppercase().optional()
        .messages({
            "string.pattern.base": "Please provide a valid GST number",
        }),

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

    userType: Joi.string().valid("APPLICANT", "DGO", "RSGWA", "ENFORCEMENT").optional(),

    captcha: Joi.string().optional(),
});

// Forgot password validation
const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required()
        .messages({
            "string.email": "Please provide a valid email address",
            "string.empty": "Email is required",
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

module.exports = {
    validateRegister: validate(registerSchema),
    validateLogin: validate(loginSchema),
    validateForgotPassword: validate(forgotPasswordSchema),
    validateResetPassword: validate(resetPasswordSchema),
    validateUpdateProfile: validate(updateProfileSchema),
};
