const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe,
  changePassword
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { authValidators } = require('../utils/validators');
const { apiLimiter } = require('../middleware/rateLimiter');

router.post('/register', authValidators.register, validate, register);
router.post('/login', authValidators.login, validate, login);

router.get('/me', protect, getMe);
router.put('/changepassword', protect, authValidators.changePassword, validate, changePassword);

router.post('/register-admin', [protect, adminOnly, authValidators.register, validate], register);

module.exports = router;