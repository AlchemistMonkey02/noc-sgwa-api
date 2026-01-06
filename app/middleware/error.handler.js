/**
 * Global Error Handling Middleware.
 *
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function.
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 server error if status code is not set
  const statusCode = err.statusCode || 500;

  // Log the error for debugging purposes
  // In a production environment, you would use a more sophisticated logger
  console.error({
    message: err.message,
    statusCode: statusCode,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack // Hide stack in production
  });

  res.status(statusCode).json({
    status: 'error',
    statusCode: statusCode,
    message: err.message || 'Something went wrong on the server.'
  });
};

module.exports = errorHandler;
