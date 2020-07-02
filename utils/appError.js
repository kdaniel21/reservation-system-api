module.exports = class AppError extends Error {
  constructor(errorMsg, statusCode) {
    super(errorMsg);

    this.statusCode = statusCode || 500;
    this.status = statusCode >= 500 ? 'error' : 'fail';
    this.isOperational = true;
    // Create stack property with the error stack
    Error.captureStackTrace(this.constructor);
  }
};
