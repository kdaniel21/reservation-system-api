const AppError = require('../utils/appError');

const sendErrorDev = (err, res) => {
  const statusCode = err.statusCode || 500;
  // res.status(statusCode).json({
  //   status: err.status,
  //   message: err.message,
  //   stack: err.stack,
  //   isOperational: !!err.isOperational,
  // });
  res.status(statusCode).json({ ...err, stack: err.stack });
};

const sendErrorProd = (err, res) => {
  if (!err.isOperational)
    // Send generic error for non-operational errors
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again.',
    });

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

// TRANSFORMING ERRORS FOR PRODUCTION
const handleJWTTokenExpired = () => new AppError('Token is expired.', 401);

const handleJWTMalformed = () => new AppError('Invalid token format.', 400);

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = errors.join(' ');
  return new AppError(message, 400);
};

const handleCastError = (err) =>
  new AppError(`Invalid ${err.path.replace('_', '')}: ${err.value}`, 400);

const handleDuplicateField = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `The ${field}: ${value} already exists!`;
  return new AppError(message, 400);
};

// MAIN ERROR HANDLER
const handleError = (err, req, res, next) => {
  console.log('ERROR:', err);
  // Send detailed dev errors
  if (process.env.NODE_ENV === 'development') return sendErrorDev(err, res);

  // Format different errors in prod
  let error = { ...err, message: err.message, stack: err.stack };
  if (error.message === 'jwt expired') error = handleJWTTokenExpired();
  else if (error.message === 'jwt malformed') error = handleJWTMalformed();
  else if (error.stack.startsWith('ValidationError'))
    error = handleValidationError(error);
  else if (error.stack.startsWith('CastError')) error = handleCastError(error);
  else if (error.code === 11000) error = handleDuplicateField(error);

  sendErrorProd(error, res);
};

module.exports = handleError;
