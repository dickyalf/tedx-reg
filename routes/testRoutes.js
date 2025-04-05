// routes/testRoutes.js
const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');
const qrService = require('../services/qrService');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * @desc    Test pengiriman email tiket
 * @route   POST /api/test/email-ticket
 * @access  Public (dalam development) atau Private di production
 */
router.post('/email-ticket', async (req, res) => {
  try {
    const { email, registrationId } = req.body;
    
    if (registrationId) {
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
        successResponse(`Email tiket berhasil dikirim ke ${registration.email}`)
      );
    }
    
    else if (email) {
      const dummyRegistration = {
        _id: '5f7d1d3b3c3b3c3b3c3b3c3b',
        fullName: 'Tester Dummy',
        email: email,
        phoneNumber: '081234567890',
        gender: 'Laki-laki',
        age: 25,
        registrationNumber: 'TEST-' + Date.now(),
        status: 'paid',
        attendanceStatus: 'not_attended',
        save: async () => { return; } 
      };
      
      const dummyEvent = {
        _id: '5f7d1d3b3c3b3c3b3c3b3c3c',
        name: 'Test Event',
        type: 'Pre Event 1',
        date: new Date(),
        quota: 100,
        registeredCount: 50,
        price: 0,
        description: 'Event untuk testing',
        requireFoodAllergy: false,
        isActive: true
      };
      
      const dummyPayment = {
        _id: '5f7d1d3b3c3b3c3b3c3b3c3d',
        registrationId: dummyRegistration._id,
        amount: 0,
        paymentMethod: 'free',
        status: 'success',
        transactionId: 'TEST-' + Date.now(),
        paymentDate: new Date()
      };
      
      const qrPath = await qrService.generateQR(
        dummyRegistration._id,
        dummyRegistration.registrationNumber
      );
      dummyRegistration.qrCode = qrPath;
      
      await emailService.sendRegistrationEmail(
        dummyRegistration,
        dummyEvent,
        dummyPayment
      );
      
      return res.status(200).json(
        successResponse(`Email tiket testing berhasil dikirim ke ${email}`)
      );
    }
    
    else {
      return res.status(400).json(
        errorResponse('Email atau registrationId diperlukan')
      );
    }
  } catch (error) {
    logger.error(`Error in test email-ticket: ${error.message}`);
    return res.status(500).json(
      errorResponse('Gagal mengirim email test: ' + error.message)
    );
  }
});

/**
 * @desc    Test generate PDF tiket
 * @route   POST /api/test/generate-pdf
 * @access  Public (dalam development) atau Private di production
 */
router.post('/generate-pdf', async (req, res) => {
  try {
    const { registrationId } = req.body;
    
    if (registrationId) {
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
      
      const pdfPath = await pdfService.generateTicketPDF(
        registration,
        registration.eventId,
        payment
      );
      
      registration.pdfTicket = pdfPath;
      await registration.save();
      
      return res.status(200).json(
        successResponse('PDF tiket berhasil di-generate', {
          pdfUrl: process.env.BASE_URL + pdfPath
        })
      );
    }
    
    else {
      return res.status(400).json(
        errorResponse('RegistrationId diperlukan')
      );
    }
  } catch (error) {
    logger.error(`Error in test generate-pdf: ${error.message}`);
    return res.status(500).json(
      errorResponse('Gagal membuat PDF test: ' + error.message)
    );
  }
});

module.exports = router;