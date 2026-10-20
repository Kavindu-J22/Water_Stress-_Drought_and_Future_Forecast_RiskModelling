/**
 * Standardized API Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';
  const details = err.details || (process.env.NODE_ENV === 'development' ? err.stack : undefined);

  res.status(statusCode).json({
    code: errorCode,
    message,
    details
  });
}

module.exports = errorHandler;
