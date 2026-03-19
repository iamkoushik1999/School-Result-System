/**
 * 404 handler — mount before errorHandler
 * Catches any request that didn't match a route.
 */
export const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

/**
 * Global error handler.
 *
 * Works with:
 *  - express-async-handler  (unhandled promise rejections auto-forwarded)
 *  - next(createError(status, message))  (structured errors from controllers)
 *  - Joi validation errors  (passed from validate middleware with err.details)
 *  - Mongoose duplicate key errors  (code 11000)
 *  - Mongoose cast errors  (invalid ObjectId etc.)
 */
export const errorHandler = (err, req, res, next) => {
  // Mongoose bad ObjectId  →  400
  if (err.name === 'CastError') {
    err.status = 400;
    err.message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key  →  400
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    err.status = 400;
    err.message = `Duplicate value for ${field}`;
  }

  // Mongoose validation error  →  422
  if (err.name === 'ValidationError') {
    err.status = 422;
    err.message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Only log stack for unexpected 500s
  if (statusCode === 500) {
    console.error('💥 Server Error:', err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Include field-level details from Joi validation middleware
    ...(err.details && { details: err.details }),
    // Only expose stack in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
