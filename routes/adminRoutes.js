const express = require('express');
const router = express.Router();
const { 
  getDashboardStats,
  getAllRegistrations,
  updateRegistration,
  deleteRegistration,
  getAllPayments,
  updatePaymentStatus,
  generateAttendanceReport,
  generateFinancialReport
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.use(adminOnly);

router.get('/dashboard', getDashboardStats);

router.get('/registrations', getAllRegistrations);
router.put('/registrations/:id', updateRegistration);
router.delete('/registrations/:id', deleteRegistration);

router.get('/payments', getAllPayments);
router.put('/payments/:id/status', updatePaymentStatus);

router.get('/reports/attendance', generateAttendanceReport);
router.get('/reports/financial', generateFinancialReport);

module.exports = router;