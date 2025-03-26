const midtransClient = require('midtrans-client');
const logger = require('../utils/logger');

/**
 * Konfigurasi Core API Client untuk Midtrans
 */
const createCoreApiClient = () => {
  try {
    return new midtransClient.CoreApi({
      isProduction: process.env.NODE_ENV === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });
  } catch (error) {
    logger.error(`Error creating Midtrans Core API client: ${error.message}`);
    throw new Error('Failed to initialize payment gateway');
  }
};

/**
 * Konfigurasi Snap Client untuk Midtrans
 */
const createSnapClient = () => {
  try {
    return new midtransClient.Snap({
      isProduction: process.env.NODE_ENV === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });
  } catch (error) {
    logger.error(`Error creating Midtrans Snap client: ${error.message}`);
    throw new Error('Failed to initialize payment gateway');
  }
};

module.exports = {
  core: createCoreApiClient,
  snap: createSnapClient,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
};