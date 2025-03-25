const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for API endpoints
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // limit setiap IP ke 100 request per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Terlalu banyak request, coba lagi nanti'
  }
});

/**
 * Rate limiter for registration endpoint
 */
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 10, // limit setiap IP ke 10 registrasi per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Terlalu banyak registrasi, coba lagi nanti'
  }
});

/**
 * Rate limiter for payment endpoint
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 20, // limit setiap IP ke 20 payment per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Terlalu banyak request pembayaran, coba lagi nanti'
  }
});

module.exports = {
  apiLimiter,
  registrationLimiter,
  paymentLimiter
};