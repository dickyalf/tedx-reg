const express = require('express');
const router = express.Router();
const { 
  registerAdmin, 
  login, 
  getMe,
  changePassword
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { authValidators } = require('../utils/validators');
const { apiLimiter } = require('../middleware/rateLimiter');

router.post('/login', authValidators.login, validate, login);

router.get('/me', [protect, adminOnly], getMe);
router.put('/changepassword', [protect, adminOnly, authValidators.changePassword, validate], changePassword);

router.post('/register-admin', [protect, adminOnly, authValidators.register, validate], registerAdmin);

module.exports = router;