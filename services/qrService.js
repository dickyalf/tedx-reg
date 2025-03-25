const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const ensureUploadsDir = () => {
  const uploadsDir = path.join(__dirname, '..', 'public', 'qrcodes');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

/**
 * Generate QR code untuk registrasi
 * @param {String} registrationId - ID registrasi
 * @param {String} registrationNumber - Nomor registrasi
 * @returns {Promise<String>} - Path ke QR code yang dibuat
 */
const generateQR = async (registrationId, registrationNumber) => {
  try {
    const uploadsDir = ensureUploadsDir();
    
    const qrData = JSON.stringify({
      id: registrationId,
      regNum: registrationNumber,
      timestamp: new Date().toISOString()
    });
    
    const fileName = `${registrationNumber}_${registrationId}.png`;
    const filePath = path.join(uploadsDir, fileName);
    
    await QRCode.toFile(filePath, qrData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300
    });
    
    return `/qrcodes/${fileName}`;
  } catch (error) {
    logger.error(`Error generating QR: ${error.message}`);
    throw new Error('Gagal membuat QR code');
  }
};

/**
 * Verify QR code data
 * @param {String} qrData - Data dari QR code
 * @returns {Object} - Data yang diverifikasi
 */
const verifyQR = (qrData) => {
  try {
    const data = JSON.parse(qrData);
    
    if (!data.id || !data.regNum || !data.timestamp) {
      throw new Error('QR data tidak valid');
    }
    
    return data;
  } catch (error) {
    logger.error(`Error verifying QR: ${error.message}`);
    throw new Error('QR tidak dapat diverifikasi');
  }
};

module.exports = {
  generateQR,
  verifyQR
};
