const logger = require("../utils/logger");

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
module.exports = (err, req, res, next) => {
    // Default to 500 server error if status code is not set
    const statusCode = err.statusCode || 500;
    const errorCode = err.code || "SERVER_ERROR";

    // Log the error for debugging
    logger.error({
        message: err.message,
        statusCode: statusCode,
        code: errorCode,
        stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
    });

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message: err.message || "Something went wrong on the server",
            ...(process.env.NODE_ENV === "development" && {
                stack: err.stack,
                details: err.details,
            }),
        },
        timestamp: new Date().toISOString(),
    });
};
