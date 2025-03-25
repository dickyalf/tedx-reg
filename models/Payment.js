const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    registrationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Registration',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Jumlah pembayaran harus diisi'],
        min: [0, 'Jumlah pembayaran tidak valid']
    },
    paymentMethod: {
        type: String,
        required: [true, 'Metode pembayaran harus diisi'],
        enum: ['bca_va', 'qris']
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'expired'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        unique: true
    },
    paymentDate: {
        type: Date
    },
    midtransOrderId: {
        type: String
    },
    midtransTransactionId: {
        type: String
    },
    paymentDetails: {
        type: mongoose.Schema.Types.Mixed
    },
    expiredAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);