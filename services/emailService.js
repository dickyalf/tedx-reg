const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

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
 * Kirim email registrasi sukses
 * @param {Object} registration - Data registrasi
 * @param {Object} event - Data event
 * @param {Object} payment - Data pembayaran
 * @returns {Promise<Boolean>} - Status pengiriman email
 */
const sendRegistrationEmail = async (registration, event, payment) => {
  try {
    if (!registration.qrCode) {
      throw new Error('QR Code tidak tersedia');
    }
    
    const qrCodePath = path.join(__dirname, '..', 'public', registration.qrCode);
    
    // Template email asal. nanti diubah sesuai design
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Pendaftaran Event Berhasil</h2>
        <p>Halo <strong>${registration.fullName}</strong>,</p>
        <p>Terima kasih telah mendaftar untuk acara <strong>${event.name} (${event.type})</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detail Registrasi:</h3>
          <p><strong>Nomor Registrasi:</strong> ${registration.registrationNumber}</p>
          <p><strong>Nama Lengkap:</strong> ${registration.fullName}</p>
          <p><strong>Tanggal Event:</strong> ${new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Status Pembayaran:</strong> <span style="color: green; font-weight: bold;">SUKSES</span></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p><strong>QR Code untuk Absensi:</strong></p>
          <p>Tunjukkan QR code di bawah ini saat registrasi di lokasi acara.</p>
          <img src="cid:qrcode" alt="QR Code" style="max-width: 200px; height: auto;" />
        </div>
        
        <p>Jika Anda memiliki pertanyaan, silakan hubungi kami melalui email ini.</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
          <p>Email ini dibuat secara otomatis, mohon untuk tidak membalas.</p>
        </div>
      </div>
    `;
    
    const mailOptions = {
      from: `"Event Registration" <${process.env.EMAIL_FROM}>`,
      to: registration.email,
      subject: `Pendaftaran Sukses - ${event.name} (${event.type})`,
      html: emailContent,
      attachments: [
        {
          filename: 'qrcode.png',
          path: qrCodePath,
          cid: 'qrcode' 
        }
      ]
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    throw new Error('Gagal mengirim email konfirmasi');
  }
};

module.exports = {
  sendRegistrationEmail
};