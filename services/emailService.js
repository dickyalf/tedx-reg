const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const pdfService = require('./pdfService');

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
 * @param {Object} registration - Data registrasi
 * @param {Object} event - Data event
 * @param {Object} payment - Data pembayaran
 * @param {String} pdfPath - Path ke file PDF tiket
 * @returns {String} - Template HTML email
 */
const getTicketEmailTemplate = (registration, event, payment, pdfPath) => {
  const formattedDate = event.date ? 
    new Date(event.date).toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'Tanggal tidak tersedia';
  
  const formattedTime = event.date ? 
    new Date(event.date).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : '';
  
  const formattedDateTime = `${formattedDate} - ${formattedTime}`;
  
  const formattedPrice = payment.amount ? 
    `Rp ${payment.amount.toLocaleString('id-ID')}` : 
    'GRATIS';

  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const pdfUrl = `${baseUrl}${pdfPath}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Ticket ${event.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
    
    body {
      font-family: 'Roboto', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    
    .container {
      max-width: 600px;
      margin: 20px auto;
    }
    
    .header {
      text-align: center;
      padding: 20px;
      background-color: #ffffff;
    }
    
    .header img {
      max-width: 150px;
    }
    
    .ticket-container {
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
    
    .ticket-header {
      background: linear-gradient(to bottom, #e4232e, #9b1c24);
      color: white;
      padding: 25px 20px;
      text-align: center;
      position: relative;
    }
    
    .ticket-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }
    
    .qr-container {
      background-color: #e4232e;
      padding: 30px;
      text-align: center;
    }
    
    .qr-code {
      background-color: white;
      padding: 15px;
      display: inline-block;
      border-radius: 8px;
    }
    
    .qr-code img {
      width: 200px;
      height: 200px;
    }
    
    .ticket-divider {
      height: 2px;
      width: 100%;
      background-image: linear-gradient(to right, #e4232e 50%, transparent 50%);
      background-size: 20px 1px;
      background-repeat: repeat-x;
      position: relative;
    }
    
    .ticket-divider:before, .ticket-divider:after {
      content: '';
      position: absolute;
      width: 30px;
      height: 30px;
      background-color: #f5f5f5;
      border-radius: 50%;
      top: -15px;
    }
    
    .ticket-divider:before {
      left: -15px;
    }
    
    .ticket-divider:after {
      right: -15px;
    }
    
    .ticket-body {
      background: linear-gradient(to bottom, #9b1c24, #5a0e15);
      color: white;
      padding: 30px 20px;
    }
    
    .ticket-info {
      margin-bottom: 15px;
    }
    
    .ticket-info-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 5px;
    }
    
    .ticket-info-value {
      font-size: 18px;
      font-weight: 500;
      color: white;
    }
    
    .ticket-footer {
      background-color: #3a0a0e;
      color: white;
      padding: 15px 20px;
      text-align: center;
    }
    
    .ticket-footer h3 {
      margin: 0;
      font-size: 18px;
    }
    
    .ticket-price {
      font-size: 20px;
      font-weight: 700;
    }
    
    .download-container {
      text-align: center;
      margin: 20px 0;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .download-btn {
      display: inline-block;
      background-color: #e4232e;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      font-weight: 500;
      border-radius: 4px;
      margin-top: 10px;
      font-size: 16px;
    }
    
    .download-btn:hover {
      background-color: #c41d28;
    }
    
    .footer-info {
      background-color: #ffffff;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #777;
    }
    
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        margin: 10px auto;
      }
      
      .ticket-header h1 {
        font-size: 20px;
      }
      
      .qr-code img {
        width: 150px;
        height: 150px;
      }
      
      .ticket-info-value {
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${baseUrl}/public/logo/logo.png" alt="Event Logo">
      <h2>Tiket E-Registrasi Anda</h2>
    </div>
    
    <div class="ticket-container">
      <div class="ticket-header">
        <h1>${registration.registrationNumber}</h1>
      </div>
      
      <div class="qr-container">
        <div class="qr-code">
          <img src="cid:qrcode" alt="QR Code Tiket">
        </div>
      </div>
      
      <div class="ticket-divider"></div>
      
      <div class="ticket-body">
        <div class="ticket-info">
          <div class="ticket-info-label">SHOW NAME</div>
          <div class="ticket-info-value">${event.name} (${event.type})</div>
        </div>
        
        <div class="ticket-info">
          <div class="ticket-info-label">DATE AND TIME</div>
          <div class="ticket-info-value">${formattedDateTime}</div>
        </div>
        
        <div class="ticket-info">
          <div class="ticket-info-label">CUSTOMER NAME</div>
          <div class="ticket-info-value">${registration.fullName}</div>
        </div>
        
        <div class="ticket-info">
          <div class="ticket-info-label">GENDER/AGE</div>
          <div class="ticket-info-value">${registration.gender}/${registration.age}</div>
        </div>
        
        ${registration.foodAllergy ? `
          <div class="ticket-info">
            <div class="ticket-info-label">FOOD ALLERGY</div>
            <div class="ticket-info-value">${registration.foodAllergy}</div>
          </div>
        ` : ''}
        
        <div class="ticket-info">
          <div class="ticket-info-label">EMAIL</div>
          <div class="ticket-info-value">${registration.email}</div>
        </div>
      </div>
      
      <div class="ticket-footer">
        <h3>Total Payment</h3>
        <div class="ticket-price">${formattedPrice}</div>
      </div>
    </div>
    
    <div class="download-container">
      <p>Anda juga dapat mengunduh tiket ini dalam format PDF untuk disimpan atau dicetak.</p>
      <a href="${pdfUrl}" class="download-btn">Unduh Tiket PDF</a>
    </div>
    
    <div class="footer-info">
      <p>Tunjukkan QR code ini saat registrasi di lokasi acara.</p>
      <p>Mohon jangan membagikan tiket ini kepada orang lain.</p>
      <p>Email ini dibuat secara otomatis, mohon untuk tidak membalas.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
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
    
    const pdfPath = await pdfService.generateTicketPDF(registration, event, payment);
    
    const emailContent = getTicketEmailTemplate(registration, event, payment, pdfPath);
    
    const pdfFilePath = path.join(__dirname, '..', 'public', pdfPath);
    
    const mailOptions = {
      from: `"${event.name}" <${process.env.EMAIL_FROM}>`,
      to: registration.email,
      subject: `E-Ticket ${event.name} (${event.type})`,
      html: emailContent,
      attachments: [
        {
          filename: 'qrcode.png',
          path: qrCodePath,
          cid: 'qrcode' 
        },
        {
          filename: `Tiket ${event.name} - ${registration.registrationNumber}.pdf`,
          path: pdfFilePath,
          contentType: 'application/pdf'
        }
      ]
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    
    registration.pdfTicket = pdfPath;
    await registration.save();
    
    return true;
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    throw new Error('Gagal mengirim email konfirmasi');
  }
};

module.exports = {
  sendRegistrationEmail
};