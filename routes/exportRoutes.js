const express = require('express');
const router = express.Router();
const { 
  exportRegistrationsToCSV,
  exportPaymentsToCSV,
  exportAttendanceToCSV,
  generateQRCodesBatch
} = require('../controllers/exportController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.use(adminOnly);

router.get('/registrations', exportRegistrationsToCSV);
router.get('/payments', exportPaymentsToCSV);
router.get('/attendance', exportAttendanceToCSV);

router.post('/generate-qr-batch', generateQRCodesBatch);

module.exports = router;