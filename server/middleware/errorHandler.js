const logger = require('../utils/logger');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Set default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server';
  let errors = err.errors || [];
  
  // Log the error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel](`${statusCode} - ${message}`, { 
    path: req.path,
    method: req.method,
    ip: req.ip,
    ...(err.stack ? { stack: err.stack } : {})
  });
  
  // Handle specific error types
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    
    // Extract validation errors
    errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
  }
  
  // Mongoose cast errors (invalid ObjectId, etc)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for ${field}`;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }
  
  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file type';
  }
  
  // Development vs Production error responses
  if (process.env.NODE_ENV === 'development') {
    // Include stack trace and detailed error info in development
    return res.status(statusCode).json({
      status: 'error',
      message,
      errors: errors.length > 0 ? errors : undefined,
      stack: err.stack,
      error: err
    });
  } else {
    // Send minimal error info in production
    return res.status(statusCode).json({
      status: 'error',
      message,
      errors: errors.length > 0 ? errors : undefined
    });
  }
};

// Not found handler
const notFound = (req, res, next) => {
  const error = new ApiError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

module.exports = { ApiError, errorHandler, notFound }; 