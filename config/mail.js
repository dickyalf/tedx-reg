const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Membuat transporter untuk nodemailer
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
  try {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } catch (error) {
    logger.error(`Error creating email transporter: ${error.message}`);
    throw new Error('Failed to initialize email service');
  }
};

module.exports = {
  transporter: createTransporter,
  from: process.env.EMAIL_FROM || 'noreply@example.com'
};