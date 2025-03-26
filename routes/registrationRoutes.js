const express = require('express');
const router = express.Router();
const { 
  registerEvent, 
  getRegistrationsByEvent, 
  getRegistration,
  getRegistrationByNumber,
  markAttendance,
  verifyQrCode
} = require('../controllers/registrationController');
const { protect, adminOnly } = require('../middleware/auth');
const { registrationValidators } = require('../utils/validators');
const { validate } = require('../middleware/validator');
const { apiLimiter, registrationLimiter } = require('../middleware/rateLimiter');

router.post('/', [registrationLimiter, registrationValidators, validate], registerEvent);
router.get('/:id', apiLimiter, getRegistration);
router.get('/number/:regNumber', apiLimiter, getRegistrationByNumber);

router.get('/event/:eventId', [protect, adminOnly], getRegistrationsByEvent);
router.put('/:id/attend', [protect, adminOnly], markAttendance);
router.post('/verify-qr', [protect, adminOnly], verifyQrCode);

module.exports = router;