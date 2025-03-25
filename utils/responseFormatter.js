/**
 * Format response standar
 * @param {string} status - Status response (success/error)
 * @param {string} message - Pesan untuk user
 * @param {*} data - Data yang dikirim (optional)
 * @returns {Object} - Response terformat
 */
const formatResponse = (status, message, data = null) => {
    const response = {
        status,
        message
    };

    if (data !== null) {
        response.data = data;
    }

    return response;
};

/**
 * Format success response
 * @param {string} message - Pesan sukses
 * @param {*} data - Data yang dikirim
 * @returns {Object} - Success response
 */
const successResponse = (message, data = null) => {
    return formatResponse('success', message, data);
};

/**
 * Format error response
 * @param {string} message - Pesan error
 * @param {*} errors - Detail errors (optional)
 * @returns {Object} - Error response
 */
const errorResponse = (message, errors = null) => {
    return formatResponse('error', message, errors);
};

module.exports = {
    formatResponse,
    successResponse,
    errorResponse
};