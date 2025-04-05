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
router.post('/test-ticket-email', [protect, adminOnly], async (req, res) => {
  try {
    const { registrationId } = req.body;
    
    if (!registrationId) {
      return res.status(400).json(
        errorResponse('Registration ID diperlukan')
      );
    }
    
    const registration = await Registration.findById(registrationId)
      .populate('eventId');
    
    if (!registration) {
      return res.status(404).json(
        errorResponse('Registrasi tidak ditemukan')
      );
    }
    
    const payment = await Payment.findOne({
      registrationId: registration._id,
      status: 'success'
    });
    
    if (!payment) {
      return res.status(404).json(
        errorResponse('Data pembayaran tidak ditemukan')
      );
    }
    
    if (!registration.qrCode) {
      const qrPath = await qrService.generateQR(
        registration._id,
        registration.registrationNumber
      );
      registration.qrCode = qrPath;
      await registration.save();
    }
    
    await emailService.sendRegistrationEmail(
      registration,
      registration.eventId,
      payment
    );
    
    return res.status(200).json(
      successResponse('Email tiket berhasil dikirim')
    );
  } catch (error) {
    logger.error(`Error in test-ticket-email: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error: ' + error.message)
    );
  }
});

module.exports = router;