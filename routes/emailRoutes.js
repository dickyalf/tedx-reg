const express = require('express');
const router = express.Router();
const { 
  sendBulkEmail,
  sendPaymentReminders
} = require('../controllers/emailController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.use(adminOnly);

router.post('/send-bulk', sendBulkEmail);
router.post('/send-payment-reminders', sendPaymentReminders);

module.exports = router;