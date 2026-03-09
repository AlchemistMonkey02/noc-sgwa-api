const logger = require("../utils/logger");

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
module.exports = (err, req, res, next) => {
    // Default to 500 server error if status code is not set
    const statusCode = err.statusCode || 500;
    const errorCode = err.code || "SERVER_ERROR";
    const isDevelopment = process.env.NODE_ENV === "development";

    // Log the error for debugging
    if (statusCode >= 500) {
        logger.error({
            message: err.message,
            statusCode: statusCode,
            code: errorCode,
            stack: isDevelopment ? err.stack : undefined,
            path: req.path,
            method: req.method
        });
    } else {
        logger.warn(`${req.method} ${req.path} - ${errorCode}: ${err.message}`);
    }

    // Production-safe response
    const errorResponse = {
        code: errorCode,
        message: err.isOperational || isDevelopment
            ? err.message
            : "Something went wrong. Please try again later.",
        details: err.details || undefined
    };

    // Add stack in development
    if (isDevelopment) {
        errorResponse.stack = err.stack;
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: errorResponse,
        timestamp: new Date().toISOString(),
    });
};
