const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const logger = require('../utils/logger');

/**
 * Create rate limiter with options
 */
const createRateLimiter = (options = {}) => {
    const defaults = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per window
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later'
            }
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                path: req.path,
                userId: req.user?.id
            });

            res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: options.message || 'Too many requests, please try again later',
                    retryAfter: res.getHeader('Retry-After')
                }
            });
        }
    };

    return rateLimit({ ...defaults, ...options });
};

/**
 * Auth Rate Limiter - Strict for authentication endpoints
 */
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again after 15 minutes',
    skipSuccessfulRequests: true
});

/**
 * API Rate Limiter - General API endpoints
 */
const apiLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
});

/**
 * File Upload Rate Limiter - Strict for file uploads
 */
const uploadLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: 'Too many file uploads, please try again later'
});

/**
 * Password Reset Rate Limiter
 */
const passwordResetLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts
    message: 'Too many password reset attempts, please try again after 1 hour'
});

/**
 * OTP Rate Limiter
 */
const otpLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 OTP requests
    message: 'Too many OTP requests, please try again after 15 minutes'
});

module.exports = {
    createRateLimiter,
    authLimiter,
    apiLimiter,
    uploadLimiter,
    passwordResetLimiter,
    otpLimiter
};
