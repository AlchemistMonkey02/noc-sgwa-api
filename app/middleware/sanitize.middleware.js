/**
 * Sanitize Middleware
 * Protects against XSS and injection attacks
 */

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

/**
 * Apply sanitization middleware
 */
const sanitize = [
    // Prevent NoSQL injection by removing MongoDB operators
    mongoSanitize({
        replaceWith: '_',
        onSanitize: ({ req, key }) => {
            console.warn(`Sanitized key: ${key} in request`);
        }
    }),

    // Prevent XSS attacks
    xss()
];

/**
 * Custom sanitization for specific fields
 */
const customSanitize = (req, res, next) => {
    // Sanitize common injection patterns
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;

        // Remove potentially dangerous characters
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    };

    // Recursively sanitize object
    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitizeString(obj[key]);
            } else if (typeof obj[key] === 'object') {
                sanitizeObject(obj[key]);
            }
        });

        return obj;
    };

    // Sanitize request data
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);

    next();
};

module.exports = {
    sanitize,
    customSanitize
};
