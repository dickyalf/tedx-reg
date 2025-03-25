const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Middleware untuk validasi input
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(
      errorResponse(
        'Validasi input gagal',
        errors.array().map(error => ({
          field: error.param,
          message: error.msg
        }))
      )
    );
  }
  next();
};

module.exports = { validate };

