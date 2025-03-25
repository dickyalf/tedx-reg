const logger = require('../utils/logger');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Middleware untuk handle 404 Not Found
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Middleware untuk handle errors
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`);
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} sudah terdaftar`;
    return res.status(400).json(errorResponse(message));
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json(errorResponse('Validasi gagal', messages));
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse('Token tidak valid'));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(errorResponse('Token kadaluarsa'));
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  res.json(errorResponse(
    process.env.NODE_ENV === 'production' 
      ? 'Server error' 
      : err.message,
    process.env.NODE_ENV === 'production'
      ? null
      : err.stack
  ));
};

module.exports = { notFound, errorHandler };