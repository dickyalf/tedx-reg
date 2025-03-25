const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Middleware untuk mengecek apakah user memiliki token yang valid
 */
const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;

      next();
    } catch (error) {
      return res.status(401).json(errorResponse('Token tidak valid'));
    }
  }

  if (!token) {
    return res.status(401).json(errorResponse('Token diperlukan untuk akses'));
  }
};

/**
 * Middleware untuk admin role
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json(errorResponse('Tidak memiliki izin akses'));
  }
};

module.exports = { protect, adminOnly };
