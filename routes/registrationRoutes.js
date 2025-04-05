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
router.get('/:id/generate-pdf', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('eventId');
    
    if (!registration) {
      return res.status(404).json(
        errorResponse('Registrasi tidak ditemukan')
      );
    }
    
    if (registration.status !== 'paid') {
      return res.status(400).json(
        errorResponse('Registrasi belum dibayar')
      );
    }
    
    if (!registration.qrCode) {
      return res.status(400).json(
        errorResponse('QR Code tidak tersedia')
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
    
    const pdfPath = await pdfService.generateTicketPDF(registration, registration.eventId, payment);
    
    registration.pdfTicket = pdfPath;
    await registration.save();
    
    return res.redirect(pdfPath);
  } catch (error) {
    logger.error(`Error generating PDF: ${error.message}`);
    return res.status(500).json(
      errorResponse('Gagal membuat PDF tiket: ' + error.message)
    );
  }
});

module.exports = router;