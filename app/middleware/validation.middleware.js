const { ValidationError } = require('../utils/custom-errors');

/**
 * Validation Middleware Factory
 * Validates request body, query, or params against Joi schema
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const dataToValidate = req[source];

        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false, // Return all errors
            stripUnknown: true, // Remove unknown fields
            convert: true // Type conversion
        });

        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                type: detail.type
            }));

            return next(new ValidationError('Validation failed', details));
        }

        // Replace with validated and sanitized data
        req[source] = value;
        next();
    };
};

/**
 * Validate Multiple Sources
 */
const validateAll = (schemas) => {
    return (req, res, next) => {
        const errors = [];

        // Validate each source
        Object.keys(schemas).forEach(source => {
            const { error, value } = schemas[source].validate(req[source], {
                abortEarly: false,
                stripUnknown: true,
                convert: true
            });

            if (error) {
                error.details.forEach(detail => {
                    errors.push({
                        source,
                        field: detail.path.join('.'),
                        message: detail.message,
                        type: detail.type
                    });
                });
            } else {
                req[source] = value;
            }
        });

        if (errors.length > 0) {
            return next(new ValidationError('Validation failed', errors));
        }

        next();
    };
};

module.exports = {
    validate,
    validateAll
};
