// services/pdfService.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const ensurePdfsDir = () => {
    const pdfsDir = path.join(__dirname, '..', 'public', 'pdfs');
    if (!fs.existsSync(pdfsDir)) {
        fs.mkdirSync(pdfsDir, { recursive: true });
    }
    return pdfsDir;
};

/**
 * Generate template HTML untuk PDF tiket
 * @param {Object} registration - Data registrasi
 * @param {Object} event - Data event
 * @param {Object} payment - Data pembayaran
 * @returns {String} - Template HTML
 */
const getPdfTicketTemplate = (registration, event, payment) => {
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

    const qrCodePath = path.join(__dirname, '..', 'public', registration.qrCode);
    const qrCodeBase64 = getQrCodeAsBase64(qrCodePath);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>E-Ticket ${event.name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .ticket-container {
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .ticket-header {
      background: linear-gradient(to bottom, #e4232e, #9b1c24);
      color: white;
      padding: 25px 20px;
      text-align: center;
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
    
    .footer-info {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="ticket-container">
      <div class="ticket-header">
        <h1>${registration.registrationNumber}</h1>
      </div>
      
      <div class="qr-container">
        <div class="qr-code">
        <img src="${qrCodeBase64}" alt="QR Code Tiket">
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
    
    <div class="footer-info">
      <p>Tunjukkan QR code ini saat registrasi di lokasi acara.</p>
      <p>Mohon jangan membagikan tiket ini kepada orang lain.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate PDF tiket dari registrasi
 * @param {Object} registration - Data registrasi
 * @param {Object} event - Data event
 * @param {Object} payment - Data pembayaran
 * @returns {Promise<String>} - Path ke file PDF yang dibuat
 */
const generateTicketPDF = async (registration, event, payment) => {
    try {
        const pdfsDir = ensurePdfsDir();

        const html = getPdfTicketTemplate(registration, event, payment);

        const fileName = `ticket_${registration.registrationNumber}_${uuidv4()}.pdf`;
        const filePath = path.join(pdfsDir, fileName);

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
        });

        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: 'networkidle0' });

        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        await browser.close();

        return `/pdfs/${fileName}`;
    } catch (error) {
        logger.error(`Error generating PDF ticket: ${error.message}`);
        throw new Error('Gagal membuat PDF tiket');
    }

};

const getQrCodeAsBase64 = (qrPath) => {
    try {
        const imageData = fs.readFileSync(qrPath);
        const base64 = imageData.toString('base64');
        const ext = path.extname(qrPath).substring(1); // remove dot
        return `data:image/${ext};base64,${base64}`;
    } catch (err) {
        logger.error(`Gagal membaca QR code image: ${err.message}`);
        return '';
    }
};

module.exports = {
    generateTicketPDF
};