const logger = require('../utils/logger');
const { AppError } = require('../utils/custom-errors');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
    // Set defaults
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;
    error.code = err.code || 'INTERNAL_ERROR';

    // Log error
    logger.error('Error caught by error handler', {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        body: req.body,
        query: req.query
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error.message = 'Resource not found';
        error.statusCode = 404;
        error.code = 'INVALID_ID';
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error.message = `${field} already exists`;
        error.statusCode = 409;
        error.code = 'DUPLICATE_ENTRY';
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const details = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
        error.message = 'Validation failed';
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        error.details = details;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token';
        error.statusCode = 401;
        error.code = 'INVALID_TOKEN';
    }

    if (err.name === 'TokenExpiredError') {
        error.message = 'Token expired';
        error.statusCode = 401;
        error.code = 'TOKEN_EXPIRED';
    }

    // Multer file upload errors
    if (err.name === 'MulterError') {
        error.message = `File upload error: ${err.message}`;
        error.statusCode = 400;
        error.code = 'FILE_UPLOAD_ERROR';
    }

    // Build error response
    const errorResponse = {
        success: false,
        error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
            timestamp: new Date().toISOString(),
            path: req.path
        }
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = err.stack;
    }

    // Add request ID if available
    if (req.id) {
        errorResponse.error.requestId = req.id;
    }

    res.status(error.statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
    const error = new AppError(
        `Route ${req.originalUrl} not found`,
        404,
        'ROUTE_NOT_FOUND'
    );
    next(error);
};

/**
 * Async Handler Wrapper
 * Catches async errors and passes to error handler
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler
};
