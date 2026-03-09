/**
 * Custom Error Classes for Application
 */

class AppError extends Error {
    constructor(code, message, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, details = []) {
        super('VALIDATION_ERROR', message, 400);
        this.details = details;
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super('NOT_FOUND', `${resource} not found`, 404);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super('UNAUTHORIZED', message, 401);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super('FORBIDDEN', message, 403);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super('CONFLICT', message, 409);
    }
}

class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super('BAD_REQUEST', message, 400);
    }
}

class ServiceUnavailableError extends AppError {
    constructor(message = 'Service temporarily unavailable') {
        super('SERVICE_UNAVAILABLE', message, 503);
    }
}

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    BadRequestError,
    ServiceUnavailableError
};
