const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const qrService = require('../services/qrService');

/**
 * @desc    Export registrations to CSV
 * @route   GET /api/admin/export/registrations
 * @access  Private/Admin
 */
const exportRegistrationsToCSV = async (req, res) => {
  try {
    const { eventId, status } = req.query;
    
    const query = {};
    
    if (eventId) {
      query.eventId = eventId;
    }
    
    if (status) {
      query.status = status;
    }
    
    const registrations = await Registration.find(query)
      .populate('eventId', 'name type date price')
      .sort({ createdAt: -1 });
    
    if (registrations.length === 0) {
      return res.status(404).json(
        errorResponse('No registrations found')
      );
    }
    
    let csvContent = 'Registration Number,Full Name,Email,Phone Number,Gender,Age,Food Allergy,Event Name,Event Type,Event Date,Status,Attendance Status,Registration Date\n';
    
    registrations.forEach(reg => {
      const eventName = reg.eventId ? reg.eventId.name : 'N/A';
      const eventType = reg.eventId ? reg.eventId.type : 'N/A';
      const eventDate = reg.eventId ? new Date(reg.eventId.date).toLocaleDateString() : 'N/A';
      
      const escapeCsvField = field => {
        if (field === null || field === undefined) return '';
        return `"${String(field).replace(/"/g, '""')}"`;
      };
      
      csvContent += `${escapeCsvField(reg.registrationNumber)},${escapeCsvField(reg.fullName)},${escapeCsvField(reg.email)},${escapeCsvField(reg.phoneNumber)},${escapeCsvField(reg.gender)},${escapeCsvField(reg.age)},${escapeCsvField(reg.foodAllergy)},${escapeCsvField(eventName)},${escapeCsvField(eventType)},${escapeCsvField(eventDate)},${escapeCsvField(reg.status)},${escapeCsvField(reg.attendanceStatus)},${escapeCsvField(new Date(reg.registrationDate).toLocaleDateString())}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=registrations-${Date.now()}.csv`);
    
    return res.status(200).send(csvContent);
  } catch (error) {
    logger.error(`Error in exportRegistrationsToCSV: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Export payments to CSV
 * @route   GET /api/admin/export/payments
 * @access  Private/Admin
 */
const exportPaymentsToCSV = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    const payments = await Payment.find(query)
      .populate({
        path: 'registrationId',
        select: 'fullName email registrationNumber eventId',
        populate: {
          path: 'eventId',
          select: 'name type'
        }
      })
      .sort({ createdAt: -1 });
    
    if (payments.length === 0) {
      return res.status(404).json(
        errorResponse('No payments found')
      );
    }
    
    let csvContent = 'Payment ID,Transaction ID,Registration Number,Full Name,Email,Event Name,Event Type,Amount,Payment Method,Status,Payment Date,Created Date\n';
    
    payments.forEach(payment => {
      const regNumber = payment.registrationId ? payment.registrationId.registrationNumber : 'N/A';
      const fullName = payment.registrationId ? payment.registrationId.fullName : 'N/A';
      const email = payment.registrationId ? payment.registrationId.email : 'N/A';
      const eventName = payment.registrationId && payment.registrationId.eventId ? payment.registrationId.eventId.name : 'N/A';
      const eventType = payment.registrationId && payment.registrationId.eventId ? payment.registrationId.eventId.type : 'N/A';
      const paymentDate = payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : 'N/A';
      
      const escapeCsvField = field => {
        if (field === null || field === undefined) return '';
        return `"${String(field).replace(/"/g, '""')}"`;
      };
      
      csvContent += `${escapeCsvField(payment._id)},${escapeCsvField(payment.transactionId)},${escapeCsvField(regNumber)},${escapeCsvField(fullName)},${escapeCsvField(email)},${escapeCsvField(eventName)},${escapeCsvField(eventType)},${escapeCsvField(payment.amount)},${escapeCsvField(payment.paymentMethod)},${escapeCsvField(payment.status)},${escapeCsvField(paymentDate)},${escapeCsvField(new Date(payment.createdAt).toLocaleString())}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payments-${Date.now()}.csv`);
    
    return res.status(200).send(csvContent);
  } catch (error) {
    logger.error(`Error in exportPaymentsToCSV: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Export attendance report to CSV
 * @route   GET /api/admin/export/attendance
 * @access  Private/Admin
 */
const exportAttendanceToCSV = async (req, res) => {
  try {
    const { eventId } = req.query;
    
    let query = { status: 'paid' };
    
    if (eventId) {
      query.eventId = eventId;
    }
    
    const attendanceData = await Registration.find(query)
      .populate('eventId', 'name type date')
      .select('fullName email phoneNumber gender age foodAllergy registrationNumber attendanceStatus eventId')
      .sort({ 'eventId.date': 1, fullName: 1 });
    
    if (attendanceData.length === 0) {
      return res.status(404).json(
        errorResponse('No attendance data found')
      );
    }
    
    let csvContent = 'Event Name,Event Type,Event Date,Registration Number,Full Name,Email,Phone,Gender,Age,Food Allergy,Attendance Status\n';
    
    attendanceData.forEach(reg => {
      const eventName = reg.eventId ? reg.eventId.name : 'N/A';
      const eventType = reg.eventId ? reg.eventId.type : 'N/A';
      const eventDate = reg.eventId ? new Date(reg.eventId.date).toLocaleDateString() : 'N/A';
      
      const escapeCsvField = field => {
        if (field === null || field === undefined) return '';
        return `"${String(field).replace(/"/g, '""')}"`;
      };
      
      csvContent += `${escapeCsvField(eventName)},${escapeCsvField(eventType)},${escapeCsvField(eventDate)},${escapeCsvField(reg.registrationNumber)},${escapeCsvField(reg.fullName)},${escapeCsvField(reg.email)},${escapeCsvField(reg.phoneNumber)},${escapeCsvField(reg.gender)},${escapeCsvField(reg.age)},${escapeCsvField(reg.foodAllergy)},${escapeCsvField(reg.attendanceStatus)}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${Date.now()}.csv`);
    
    return res.status(200).send(csvContent);
  } catch (error) {
    logger.error(`Error in exportAttendanceToCSV: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Generate QR codes in batch for an event
 * @route   POST /api/admin/export/generate-qr-batch
 * @access  Private/Admin
 */
const generateQRCodesBatch = async (req, res) => {
  try {
    const { eventId } = req.body;
    
    if (!eventId) {
      return res.status(400).json(
        errorResponse('Event ID is required')
      );
    }
    
    const registrations = await Registration.find({
      eventId,
      status: 'paid',
      qrCode: { $exists: false }
    });
    
    if (registrations.length === 0) {
      return res.status(404).json(
        errorResponse('No eligible registrations found for QR generation')
      );
    }
    
    const results = [];
    
    for (const registration of registrations) {
      try {
        const qrPath = await qrService.generateQR(
          registration._id,
          registration.registrationNumber
        );
        
        registration.qrCode = qrPath;
        await registration.save();
        
        results.push({
          registrationId: registration._id,
          registrationNumber: registration.registrationNumber,
          success: true,
          qrPath
        });
      } catch (err) {
        results.push({
          registrationId: registration._id,
          registrationNumber: registration.registrationNumber,
          success: false,
          error: err.message
        });
      }
    }
    
    return res.status(200).json(
      successResponse(`QR codes generated for ${results.filter(r => r.success).length} registrations`, {
        total: registrations.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      })
    );
  } catch (error) {
    logger.error(`Error in generateQRCodesBatch: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

module.exports = {
  exportRegistrationsToCSV,
  exportPaymentsToCSV,
  exportAttendanceToCSV,
  generateQRCodesBatch
};