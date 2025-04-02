const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ isActive: true });
    const totalRegistrations = await Registration.countDocuments();
    const paidRegistrations = await Registration.countDocuments({ status: 'paid' });
    const pendingRegistrations = await Registration.countDocuments({ status: 'pending' });
    
    const payments = await Payment.find({ status: 'success' });
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const attendedCount = await Registration.countDocuments({ 
      status: 'paid', 
      attendanceStatus: 'attended' 
    });
    
    const attendanceRate = paidRegistrations > 0 
      ? (attendedCount / paidRegistrations * 100).toFixed(2) 
      : 0;
    
    const eventStats = await Event.aggregate([
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: 'eventId',
          as: 'registrations'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          type: 1,
          date: 1,
          quota: 1,
          registeredCount: 1,
          price: 1,
          totalRegistrations: { $size: '$registrations' },
          paidRegistrations: {
            $size: {
              $filter: {
                input: '$registrations',
                as: 'reg',
                cond: { $eq: ['$$reg.status', 'paid'] }
              }
            }
          }
        }
      }
    ]);
    
    return res.status(200).json(
      successResponse('Dashboard statistics retrieved', {
        totalEvents,
        activeEvents,
        totalRegistrations,
        paidRegistrations,
        pendingRegistrations,
        totalRevenue,
        attendedCount,
        attendanceRate,
        eventStats
      })
    );
  } catch (error) {
    logger.error(`Error in getDashboardStats: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Get all registrations with full details
 * @route   GET /api/admin/registrations
 * @access  Private/Admin
 */
const getAllRegistrations = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = -1,
      status,
      eventId,
      search
    } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (eventId) {
      query.eventId = eventId;
    }
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const registrations = await Registration.find(query)
      .populate('eventId', 'name type date price')
      .sort({ [sortBy]: sortOrder })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Registration.countDocuments(query);
    
    return res.status(200).json(
      successResponse('Registrations retrieved successfully', {
        registrations,
        pagination: {
          total,
          page: page * 1,
          limit: limit * 1,
          pages: Math.ceil(total / limit)
        }
      })
    );
  } catch (error) {
    logger.error(`Error in getAllRegistrations: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Update registration details
 * @route   PUT /api/admin/registrations/:id
 * @access  Private/Admin
 */
const updateRegistration = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      gender,
      age,
      foodAllergy,
      status,
      attendanceStatus
    } = req.body;
    
    let registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json(
        errorResponse('Registration not found')
      );
    }
    
    if (fullName) registration.fullName = fullName;
    if (email) registration.email = email;
    if (phoneNumber) registration.phoneNumber = phoneNumber;
    if (gender) registration.gender = gender;
    if (age) registration.age = age;
    if (foodAllergy) registration.foodAllergy = foodAllergy;
    if (status) registration.status = status;
    if (attendanceStatus) registration.attendanceStatus = attendanceStatus;
    
    await registration.save();
    
    registration = await Registration.findById(req.params.id)
      .populate('eventId', 'name type date price');
    
    return res.status(200).json(
      successResponse('Registration updated successfully', registration)
    );
  } catch (error) {
    logger.error(`Error in updateRegistration: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json(
        errorResponse('Registration not found')
      );
    }
    
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Delete registration
 * @route   DELETE /api/admin/registrations/:id
 * @access  Private/Admin
 */
const deleteRegistration = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const registration = await Registration.findById(req.params.id).session(session);
    
    if (!registration) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(
        errorResponse('Registration not found')
      );
    }
    
    if (registration.eventId && registration.status !== 'cancelled') {
      const event = await Event.findById(registration.eventId).session(session);
      
      if (event) {
        event.registeredCount = Math.max(0, event.registeredCount - 1);
        await event.save({ session });
      }
    }
    
    await Payment.deleteMany({ registrationId: registration._id }).session(session);
    
    await Registration.deleteOne({ _id: registration._id }).session(session);
    
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json(
      successResponse('Registration deleted successfully')
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error(`Error in deleteRegistration: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json(
        errorResponse('Registration not found')
      );
    }
    
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Get all payments with full details
 * @route   GET /api/admin/payments
 * @access  Private/Admin
 */
const getAllPayments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = -1,
      status,
      paymentMethod,
      registrationId
    } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    
    if (registrationId) {
      query.registrationId = registrationId;
    }
    
    const payments = await Payment.find(query)
      .populate({
        path: 'registrationId',
        select: 'fullName email registrationNumber eventId',
        populate: {
          path: 'eventId',
          select: 'name type date'
        }
      })
      .sort({ [sortBy]: sortOrder })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Payment.countDocuments(query);
    
    return res.status(200).json(
      successResponse('Payments retrieved successfully', {
        payments,
        pagination: {
          total,
          page: page * 1,
          limit: limit * 1,
          pages: Math.ceil(total / limit)
        }
      })
    );
  } catch (error) {
    logger.error(`Error in getAllPayments: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Update payment status manually
 * @route   PUT /api/admin/payments/:id/status
 * @access  Private/Admin
 */
const updatePaymentStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'success', 'failed', 'expired'].includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(
        errorResponse('Invalid status')
      );
    }
    
    const payment = await Payment.findById(req.params.id).session(session);
    
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(
        errorResponse('Payment not found')
      );
    }
    
    payment.status = status;
    
    if (status === 'success') {
      payment.paymentDate = new Date();
    }
    
    await payment.save({ session });
    
    if (status === 'success') {
      const registration = await Registration.findById(payment.registrationId).session(session);
      
      if (registration) {
        registration.status = 'paid';
        await registration.save({ session });
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    const updatedPayment = await Payment.findById(req.params.id)
      .populate({
        path: 'registrationId',
        select: 'fullName email registrationNumber status eventId',
        populate: {
          path: 'eventId',
          select: 'name type date'
        }
      });
    
    return res.status(200).json(
      successResponse('Payment status updated successfully', updatedPayment)
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error(`Error in updatePaymentStatus: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json(
        errorResponse('Payment not found')
      );
    }
    
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Generate attendance report
 * @route   GET /api/admin/reports/attendance
 * @access  Private/Admin
 */
const generateAttendanceReport = async (req, res) => {
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
    
    const eventGroups = {};
    
    attendanceData.forEach(registration => {
      const eventName = registration.eventId ? `${registration.eventId.name} (${registration.eventId.type})` : 'Unknown Event';
      
      if (!eventGroups[eventName]) {
        eventGroups[eventName] = {
          eventName,
          eventDate: registration.eventId ? registration.eventId.date : null,
          attendees: [],
          stats: {
            totalRegistered: 0,
            attended: 0,
            notAttended: 0,
            attendanceRate: 0
          }
        };
      }
      
      eventGroups[eventName].attendees.push({
        registrationNumber: registration.registrationNumber,
        fullName: registration.fullName,
        email: registration.email,
        phoneNumber: registration.phoneNumber,
        gender: registration.gender,
        age: registration.age,
        foodAllergy: registration.foodAllergy,
        attendanceStatus: registration.attendanceStatus
      });
      
      eventGroups[eventName].stats.totalRegistered++;
      
      if (registration.attendanceStatus === 'attended') {
        eventGroups[eventName].stats.attended++;
      } else {
        eventGroups[eventName].stats.notAttended++;
      }
    });
    
    Object.values(eventGroups).forEach(group => {
      group.stats.attendanceRate = group.stats.totalRegistered > 0 
        ? (group.stats.attended / group.stats.totalRegistered * 100).toFixed(2) 
        : 0;
    });
    
    const sortedGroups = Object.values(eventGroups).sort((a, b) => {
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return new Date(a.eventDate) - new Date(b.eventDate);
    });
    
    return res.status(200).json(
      successResponse('Attendance report generated successfully', sortedGroups)
    );
  } catch (error) {
    logger.error(`Error in generateAttendanceReport: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Generate financial report
 * @route   GET /api/admin/reports/financial
 * @access  Private/Admin
 */
const generateFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateQuery = {};
    
    if (startDate || endDate) {
      dateQuery.paymentDate = {};
      
      if (startDate) {
        dateQuery.paymentDate.$gte = new Date(startDate);
      }
      
      if (endDate) {
        dateQuery.paymentDate.$lte = new Date(endDate);
      }
    }
    
    const payments = await Payment.find({
      status: 'success',
      ...dateQuery
    })
      .populate({
        path: 'registrationId',
        select: 'fullName email registrationNumber eventId',
        populate: {
          path: 'eventId',
          select: 'name type'
        }
      })
      .sort({ paymentDate: 1 });
    
    const eventRevenue = {};
    let totalRevenue = 0;
    
    payments.forEach(payment => {
      const eventName = payment.registrationId && payment.registrationId.eventId 
        ? `${payment.registrationId.eventId.name} (${payment.registrationId.eventId.type})` 
        : 'Unknown Event';
      
      if (!eventRevenue[eventName]) {
        eventRevenue[eventName] = {
          eventName,
          transactions: 0,
          revenue: 0,
          payments: []
        };
      }
      
      eventRevenue[eventName].transactions++;
      eventRevenue[eventName].revenue += payment.amount;
      totalRevenue += payment.amount;
      
      eventRevenue[eventName].payments.push({
        paymentId: payment._id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        registrationNumber: payment.registrationId ? payment.registrationId.registrationNumber : 'N/A',
        fullName: payment.registrationId ? payment.registrationId.fullName : 'N/A',
        email: payment.registrationId ? payment.registrationId.email : 'N/A'
      });
    });
    
    const paymentMethodSummary = {};
    
    payments.forEach(payment => {
      const method = payment.paymentMethod;
      
      if (!paymentMethodSummary[method]) {
        paymentMethodSummary[method] = {
          method,
          count: 0,
          amount: 0
        };
      }
      
      paymentMethodSummary[method].count++;
      paymentMethodSummary[method].amount += payment.amount;
    });
    
    return res.status(200).json(
      successResponse('Financial report generated successfully', {
        totalRevenue,
        eventBreakdown: Object.values(eventRevenue),
        paymentMethodSummary: Object.values(paymentMethodSummary),
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'Present'
        }
      })
    );
  } catch (error) {
    logger.error(`Error in generateFinancialReport: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

module.exports = {
  getDashboardStats,
  getAllRegistrations,
  updateRegistration,
  deleteRegistration,
  getAllPayments,
  updatePaymentStatus,
  generateAttendanceReport,
  generateFinancialReport
};