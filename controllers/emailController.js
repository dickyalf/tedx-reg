const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * @desc    Send bulk email to event participants
 * @route   POST /api/admin/email/send-bulk
 * @access  Private/Admin
 */
const sendBulkEmail = async (req, res) => {
  try {
    const { eventId, subject, message, includeQR, emailType, status } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json(
        errorResponse('Subject and message are required')
      );
    }
    
    let query = {};
    
    if (eventId) {
      query.eventId = eventId;
    }
    
    if (status) {
      query.status = status;
    } else {
      query.status = 'paid';
    }
    
    const registrations = await Registration.find(query)
      .populate('eventId', 'name type date');
    
    if (registrations.length === 0) {
      return res.status(404).json(
        errorResponse('No recipients found for the specified criteria')
      );
    }
    
    const results = {
      total: registrations.length,
      sent: 0,
      failed: 0,
      failures: []
    };
    
    const getEmailTemplate = (registration, eventData, messageContent) => {
      const eventInfo = eventData ? 
        `${eventData.name} (${eventData.type}) pada ${new Date(eventData.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : 
        'event';
      
      let emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">${subject}</h2>
          <p>Halo <strong>${registration.fullName}</strong>,</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Detail Registrasi:</strong></p>
            <p><strong>Nomor Registrasi:</strong> ${registration.registrationNumber}</p>
            <p><strong>Event:</strong> ${eventInfo}</p>
          </div>
          
          <div style="margin: 20px 0;">
            ${messageContent}
          </div>
          
          ${includeQR && registration.qrCode ? `
          <div style="text-align: center; margin: 30px 0;">
            <p><strong>QR Code untuk Absensi:</strong></p>
            <p>Tunjukkan QR code di bawah ini saat registrasi di lokasi acara.</p>
            <img src="cid:qrcode" alt="QR Code" style="max-width: 200px; height: auto;" />
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>Email ini dibuat secara otomatis, mohon untuk tidak membalas.</p>
          </div>
        </div>
      `;
      
      return emailContent;
    };
    
    for (const registration of registrations) {
      try {
        const emailContent = getEmailTemplate(
          registration, 
          registration.eventId, 
          message
        );
        
        const mailOptions = {
          from: `"Event Registration" <${process.env.EMAIL_FROM}>`,
          to: registration.email,
          subject: subject,
          html: emailContent
        };
        
        if (includeQR && registration.qrCode) {
          const qrCodePath = path.join(__dirname, '..', 'public', registration.qrCode);
          
          if (fs.existsSync(qrCodePath)) {
            mailOptions.attachments = [
              {
                filename: 'qrcode.png',
                path: qrCodePath,
                cid: 'qrcode'
              }
            ];
          }
        }
        
        await transporter.sendMail(mailOptions);
        results.sent++;
      } catch (error) {
        results.failed++;
        results.failures.push({
          email: registration.email,
          name: registration.fullName,
          error: error.message
        });
        logger.error(`Failed to send email to ${registration.email}: ${error.message}`);
      }
    }
    
    return res.status(200).json(
      successResponse('Bulk email process completed', results)
    );
  } catch (error) {
    logger.error(`Error in sendBulkEmail: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Send reminder emails for pending payments
 * @route   POST /api/admin/email/send-payment-reminders
 * @access  Private/Admin
 */
const sendPaymentReminders = async (req, res) => {
  try {
    const { eventId, customMessage } = req.body;
    
    let query = { status: 'pending' };
    
    if (eventId) {
      query.eventId = eventId;
    }
    
    const registrations = await Registration.find(query)
      .populate('eventId', 'name type date price');
    
    if (registrations.length === 0) {
      return res.status(404).json(
        errorResponse('No pending registrations found')
      );
    }
    
    const results = {
      total: registrations.length,
      sent: 0,
      failed: 0,
      failures: []
    };
    
    const getReminderTemplate = (registration, eventData, customMsg) => {
      const eventInfo = eventData ? 
        `${eventData.name} (${eventData.type}) pada ${new Date(eventData.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : 
        'event';
      
      const price = eventData ? `Rp ${eventData.price.toLocaleString('id-ID')}` : 'sesuai ketentuan';
      
      let emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Pengingat Pembayaran</h2>
          <p>Halo <strong>${registration.fullName}</strong>,</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p>Ini adalah pengingat bahwa pembayaran Anda untuk:</p>
            <p><strong>Event:</strong> ${eventInfo}</p>
            <p><strong>Nomor Registrasi:</strong> ${registration.registrationNumber}</p>
            <p><strong>Total Pembayaran:</strong> ${price}</p>
            <p>masih <strong style="color: red;">BELUM SELESAI</strong>.</p>
          </div>
          
          <div style="margin: 20px 0;">
            <p>Mohon segera selesaikan pembayaran Anda untuk mengkonfirmasi kehadiran di event ini.</p>
            ${customMsg ? `<p>${customMsg}</p>` : ''}
            <p>Jika Anda sudah melakukan pembayaran, mohon abaikan email ini.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>Email ini dibuat secara otomatis, mohon untuk tidak membalas.</p>
          </div>
        </div>
      `;
      
      return emailContent;
    };
    
    for (const registration of registrations) {
      try {
        const emailContent = getReminderTemplate(
          registration, 
          registration.eventId, 
          customMessage
        );
        
        const mailOptions = {
          from: `"Event Registration" <${process.env.EMAIL_FROM}>`,
          to: registration.email,
          subject: "Pengingat Pembayaran Registrasi Event",
          html: emailContent
        };
        
        // Send email
        await transporter.sendMail(mailOptions);
        results.sent++;
      } catch (error) {
        results.failed++;
        results.failures.push({
          email: registration.email,
          name: registration.fullName,
          error: error.message
        });
        logger.error(`Failed to send reminder to ${registration.email}: ${error.message}`);
      }
    }
    
    return res.status(200).json(
      successResponse('Payment reminder process completed', results)
    );
  } catch (error) {
    logger.error(`Error in sendPaymentReminders: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

module.exports = {
  sendBulkEmail,
  sendPaymentReminders
};