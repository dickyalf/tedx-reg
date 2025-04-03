const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');
const qrService = require('../services/qrService');
const mongoose = require('mongoose');


/**
 * @desc    Register user to event
 * @route   POST /api/registrations
 * @access  Public
 */
const registerEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      fullName,
      email,
      phoneNumber,
      gender,
      age,
      foodAllergy,
      eventId
    } = req.body;

    const event = await Event.findOne({ 
      _id: eventId, 
      isActive: true 
    }).session(session);

    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(
        errorResponse('Event tidak ditemukan atau tidak aktif')
      );
    }

    if (event.registeredCount >= event.quota) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(
        errorResponse('Kuota event sudah penuh')
      );
    }

    const existingRegistration = await Registration.findOne({
      email,
      eventId,
      status: { $in: ['pending', 'paid'] }
    }).session(session);

    if (existingRegistration) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(
        errorResponse('Email sudah terdaftar untuk event ini')
      );
    }

    if (event.type === 'Main Event' && event.requireFoodAllergy && (!foodAllergy || foodAllergy === '-')) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(
        errorResponse('Alergi makanan wajib diisi untuk Main Event')
      );
    }

    const registration = new Registration({
      fullName,
      email,
      phoneNumber,
      gender,
      age,
      foodAllergy: foodAllergy || '-',
      eventId
    });

    await registration.save({ session });

    event.registeredCount += 1;
    await event.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(
      successResponse('Registrasi berhasil dibuat', registration)
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error(`Error in registerEvent: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Get registrations by event ID
 * @route   GET /api/events/:eventId/registrations
 * @access  Private/Admin
 */
const getRegistrationsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json(
        errorResponse('Event tidak ditemukan')
      );
    }
    
    const registrations = await Registration.find({ eventId }).select('-__v');
    
    return res.status(200).json(
      successResponse('Data registrasi berhasil diambil', registrations)
    );
  } catch (error) {
    logger.error(`Error in getRegistrationsByEvent: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json(
        errorResponse('Event tidak ditemukan')
      );
    }
    
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Get registration by ID
 * @route   GET /api/registrations/:id
 * @access  Public
 */
const getRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .select('-__v')
      .populate('eventId', 'name type date price');
    
    if (!registration) {
      return res.status(404).json(
        errorResponse('Registrasi tidak ditemukan')
      );
    }
    
    return res.status(200).json(
      successResponse('Data registrasi berhasil diambil', registration)
    );
  } catch (error) {
    logger.error(`Error in getRegistration: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json(
        errorResponse('Registrasi tidak ditemukan')
      );
    }
    
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Get registration by registration number
 * @route   GET /api/registrations/number/:regNumber
 * @access  Public
 */
const getRegistrationByNumber = async (req, res) => {
  try {
    const registration = await Registration.findOne({ 
      registrationNumber: req.params.regNumber 
    })
      .select('-__v')
      .populate('eventId', 'name type date price');
    
    if (!registration) {
      return res.status(404).json(
        errorResponse('Registrasi tidak ditemukan')
      );
    }
    
    return res.status(200).json(
      successResponse('Data registrasi berhasil diambil', registration)
    );
  } catch (error) {
    logger.error(`Error in getRegistrationByNumber: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Mark registration as attended
 * @route   PUT /api/registrations/:id/attend
 * @access  Private/Admin
 */
const markAttendance = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json(
        errorResponse('Registrasi tidak ditemukan')
      );
    }
    
    if (registration.status !== 'paid') {
      return res.status(400).json(
        errorResponse('Pembayaran belum selesai')
      );
    }
    
    registration.attendanceStatus = 'attended';
    await registration.save();
    
    return res.status(200).json(
      successResponse('Kehadiran berhasil dicatat', registration)
    );
  } catch (error) {
    logger.error(`Error in markAttendance: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json(
        errorResponse('Registrasi tidak ditemukan')
      );
    }
    
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Verify QR code for attendance
 * @route   POST /api/registrations/verify-qr
 * @access  Private/Admin
 */
const verifyQrCode = async (req, res) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json(
        errorResponse('Data QR tidak diberikan')
      );
    }
    
    const verifiedData = qrService.verifyQR(qrData);
    
    const registration = await Registration.findById(verifiedData.id)
      .populate('eventId', 'name type date');
    
    if (!registration) {
      return res.status(404).json(
        errorResponse('Registrasi tidak ditemukan')
      );
    }
    
    if (registration.registrationNumber !== verifiedData.regNum) {
      return res.status(400).json(
        errorResponse('Data QR tidak valid')
      );
    }
    
    if (registration.status !== 'paid') {
      return res.status(400).json(
        errorResponse('Pembayaran belum selesai')
      );
    }
    
    registration.attendanceStatus = 'attended';
    await registration.save();
    
    return res.status(200).json(
      successResponse('Verifikasi QR code berhasil', {
        registration,
        event: registration.eventId
      })
    );
  } catch (error) {
    logger.error(`Error in verifyQrCode: ${error.message}`);
    return res.status(500).json(
      errorResponse('Error: ' + error.message)
    );
  }
};

module.exports = {
  registerEvent,
  getRegistrationsByEvent,
  getRegistration,
  getRegistrationByNumber,
  markAttendance,
  verifyQrCode
};