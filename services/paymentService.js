const midtransClient = require('midtrans-client');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const core = new midtransClient.CoreApi({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Client config untuk Snap API (jika diperlukan)
const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

/**
 * Membuat transaksi BCA Virtual Account
 * @param {Object} payment - Data pembayaran
 * @param {Object} registration - Data registrasi
 * @param {Object} event - Data event
 * @returns {Promise<Object>} - Hasil transaksi
 */
const createBcaVaTransaction = async (payment, registration, event) => {
  try {
    const orderId = `ORDER-${uuidv4()}`;

    const transactionDetails = {
      order_id: orderId,
      gross_amount: payment.amount
    };

    const customerDetails = {
      first_name: registration.fullName.split(' ')[0],
      last_name: registration.fullName.split(' ').slice(1).join(' ') || '',
      email: registration.email,
      phone: registration.phoneNumber
    };

    const itemDetails = [{
      id: event._id,
      price: payment.amount,
      quantity: 1,
      name: `${event.name} (${event.type})`
    }];

    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 24);
    const expiryTime = currentDate.toISOString();

    const bcaParameter = {
      payment_type: 'bank_transfer',
      transaction_details: transactionDetails,
      customer_details: customerDetails,
      item_details: itemDetails,
      bank_transfer: {
        bank: 'bca',
        va_number: `${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
      },
      custom_expiry: {
        expiry_duration: 24,
        unit: 'hour'
      }
    };

    // Membuat transaksi
    const response = await core.charge(bcaParameter);

    return {
      ...response,
      expiryTime
    };
  } catch (error) {
    logger.error(`Error creating BCA VA transaction: ${error.message}`);
    throw new Error('Gagal membuat transaksi BCA Virtual Account');
  }
};

/**
 * Membuat transaksi QRIS
 * @param {Object} payment - Data pembayaran
 * @param {Object} registration - Data registrasi
 * @param {Object} event - Data event
 * @returns {Promise<Object>} - Hasil transaksi
 */
const createQrisTransaction = async (payment, registration, event) => {
  try {
    const orderId = `ORDER-${uuidv4()}`;

    const transactionDetails = {
      order_id: orderId,
      gross_amount: payment.amount
    };

    const customerDetails = {
      first_name: registration.fullName.split(' ')[0],
      last_name: registration.fullName.split(' ').slice(1).join(' ') || '',
      email: registration.email,
      phone: registration.phoneNumber
    };

    const itemDetails = [{
      id: event._id,
      price: payment.amount,
      quantity: 1,
      name: `${event.name} (${event.type})`
    }];

    const qrisParameter = {
      payment_type: 'gopay',
      transaction_details: transactionDetails,
      customer_details: customerDetails,
      item_details: itemDetails,
      custom_expiry: {
        expiry_duration: 24,
        unit: 'hour'
      },
    };

    const response = await core.charge(qrisParameter);

    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 24);
    const expiryTime = currentDate.toISOString();

    return {
      ...response,
      expiryTime
    };
  } catch (error) {
    logger.error(`Error creating QRIS transaction: ${error.message}`);
    throw new Error('Gagal membuat transaksi QRIS');
  }
};

/**
 * Mengecek status transaksi di Midtrans
 * @param {String} orderId - ID order dari Midtrans
 * @returns {Promise<Object>} - Status transaksi
 */
const checkTransactionStatus = async (orderId) => {
  try {
    const response = await core.transaction.status(orderId);
    return response;
  } catch (error) {
    logger.error(`Error checking transaction status: ${error.message}`);
    throw new Error('Gagal memeriksa status transaksi');
  }
};

module.exports = {
  createBcaVaTransaction,
  createQrisTransaction,
  checkTransactionStatus
};