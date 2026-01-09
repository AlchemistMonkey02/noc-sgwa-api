const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Request Logger Middleware
 * Logs all incoming requests and responses
 */
const requestLogger = (req, res, next) => {
    // Generate unique request ID
    req.id = uuidv4();

    // Start timer
    const startTime = Date.now();

    // Log request
    logger.info('Incoming request', {
        requestId: req.id,
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?.id
    });

    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;

        logger.info('Request completed', {
            requestId: req.id,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.id
        });

        originalSend.call(this, data);
    };

    next();
};

module.exports = requestLogger;
