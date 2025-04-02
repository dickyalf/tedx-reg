const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const qrService = require('../services/qrService');

/**
 * @desc    Create payment
 * @route   POST /api/payments
 * @access  Public
 */
const createPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { registrationId, paymentMethod } = req.body;

    const registration = await Registration.findById(registrationId).session(session);
    
    if (!registration) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(
        errorResponse('Registrasi tidak ditemukan')
      );
    }

    if (registration.status === 'paid') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(
        errorResponse('Registrasi sudah dibayar')
      );
    }

    const event = await Event.findById(registration.eventId).session(session);
    
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(
        errorResponse('Event tidak ditemukan')
      );
    }

    if (event.price === 0) {
      registration.status = 'paid';
      
      try {
        const qrPath = await qrService.generateQR(registration._id, registration.registrationNumber);
        registration.qrCode = qrPath;
      } catch (qrError) {
        logger.error(`Error generating QR: ${qrError.message}`);
      }
      
      await registration.save({ session });
      
      const payment = new Payment({
        registrationId,
        amount: 0,
        paymentMethod: 'free',
        status: 'success',
        transactionId: `FREE-${Date.now()}`,
        paymentDate: new Date()
      });
      
      await payment.save({ session });
      
      try {
        await emailService.sendRegistrationEmail(registration, event, payment);
        logger.info(`Registration confirmation email sent to ${registration.email}`);
      } catch (emailError) {
        logger.error(`Error sending confirmation email: ${emailError.message}`);
      }
      
      await session.commitTransaction();
      session.endSession();
      
      return res.status(200).json(
        successResponse('Registrasi gratis berhasil', {
          registration,
          payment
        })
      );
    }
    
    const pendingPayment = await Payment.findOne({
      registrationId,
      status: 'pending'
    }).session(session);

    if (pendingPayment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(
        errorResponse('Masih ada pembayaran yang belum selesai')
      );
    }

    const payment = new Payment({
      registrationId,
      amount: event.price,
      paymentMethod,
      status: 'pending'
    });

    await payment.save({ session });

    let paymentGatewayResponse;

    if (paymentMethod === 'bca_va') {
      paymentGatewayResponse = await paymentService.createBcaVaTransaction(payment, registration, event);
    } else if (paymentMethod === 'qris') {
      paymentGatewayResponse = await paymentService.createQrisTransaction(payment, registration, event);
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(
        errorResponse('Metode pembayaran tidak didukung')
      );
    }

    payment.transactionId = paymentGatewayResponse.transaction_id;
    payment.midtransOrderId = paymentGatewayResponse.order_id;
    payment.midtransTransactionId = paymentGatewayResponse.transaction_id;
    payment.paymentDetails = paymentGatewayResponse;
    payment.expiredAt = new Date(paymentGatewayResponse.expiryTime);

    await payment.save({ session });

    registration.status = 'pending';
    await registration.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(
      successResponse('Pembayaran berhasil dibuat', {
        payment,
        paymentInstructions: paymentGatewayResponse
      })
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error(`Error in createPayment: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Get payment by ID
 * @route   GET /api/payments/:id
 * @access  Public
 */
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .select('-__v')
      .populate({
        path: 'registrationId',
        populate: {
          path: 'eventId',
          select: 'name type date price'
        }
      });
    
    if (!payment) {
      return res.status(404).json(
        errorResponse('Pembayaran tidak ditemukan')
      );
    }
    
    return res.status(200).json(
      successResponse('Data pembayaran berhasil diambil', payment)
    );
  } catch (error) {
    logger.error(`Error in getPayment: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json(
        errorResponse('Pembayaran tidak ditemukan')
      );
    }
    
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Get payment by registration ID
 * @route   GET /api/payments/registration/:registrationId
 * @access  Public
 */
const getPaymentByRegistration = async (req, res) => {
  try {
    const payment = await Payment.findOne({ 
      registrationId: req.params.registrationId 
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'registrationId',
        populate: {
          path: 'eventId',
          select: 'name type date price'
        }
      });
    
    if (!payment) {
      return res.status(404).json(
        errorResponse('Pembayaran tidak ditemukan')
      );
    }
    
    return res.status(200).json(
      successResponse('Data pembayaran berhasil diambil', payment)
    );
  } catch (error) {
    logger.error(`Error in getPaymentByRegistration: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json(
        errorResponse('Pembayaran tidak ditemukan')
      );
    }
    
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Process webhook notification from Midtrans
 * @route   POST /api/payments/webhook
 * @access  Public
 */
const paymentWebhook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const notification = req.body;
    logger.info(`Payment notification received: ${JSON.stringify(notification)}`);

    if (!notification.transaction_id || !notification.order_id || !notification.transaction_status) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(
        errorResponse('Invalid notification data')
      );
    }

    const transactionStatus = await paymentService.checkTransactionStatus(notification.order_id);
    
    const payment = await Payment.findOne({ 
      midtransOrderId: notification.order_id 
    }).session(session);
    
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json(
        errorResponse('Payment not found')
      );
    }

    payment.paymentDetails = transactionStatus;

    let newStatus = payment.status;
    
    if (transactionStatus.transaction_status === 'settlement' || 
        transactionStatus.transaction_status === 'capture') {
      newStatus = 'success';
      payment.paymentDate = new Date();
    } else if (transactionStatus.transaction_status === 'expire' || 
               transactionStatus.transaction_status === 'cancel' || 
               transactionStatus.transaction_status === 'deny') {
      newStatus = transactionStatus.transaction_status === 'expire' ? 'expired' : 'failed';
    }

    payment.status = newStatus;
    await payment.save({ session });

    if (newStatus === 'success') {
      const registration = await Registration.findById(payment.registrationId).session(session);
      
      if (registration) {
        registration.status = 'paid';
        
        const qrPath = await qrService.generateQR(registration._id, registration.registrationNumber);
        registration.qrCode = qrPath;
        
        await registration.save({ session });
        
        const event = await Event.findById(registration.eventId);
        
        if (event) {
          try {
            await emailService.sendRegistrationEmail(registration, event, payment);
            logger.info(`Registration confirmation email sent to ${registration.email}`);
          } catch (emailError) {
            logger.error(`Error sending confirmation email: ${emailError.message}`);
          }
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ status: 'OK' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error(`Error in paymentWebhook: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

module.exports = {
  createPayment,
  getPayment,
  getPaymentByRegistration,
  paymentWebhook
};