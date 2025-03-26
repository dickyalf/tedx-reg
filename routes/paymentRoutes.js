const express = require('express');
const router = express.Router();
const { 
  createPayment, 
  getPayment,
  getPaymentByRegistration,
  paymentWebhook
} = require('../controllers/paymentController');
const { paymentValidators } = require('../utils/validators');
const { validate } = require('../middleware/validator');
const { apiLimiter, paymentLimiter } = require('../middleware/rateLimiter');

router.post('/', [paymentLimiter, paymentValidators, validate], createPayment);
router.get('/:id', apiLimiter, getPayment);
router.get('/registration/:registrationId', apiLimiter, getPaymentByRegistration);

router.post('/webhook', paymentWebhook);

module.exports = router;