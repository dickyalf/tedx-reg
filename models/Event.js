const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nama event harus diisi'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Tipe event harus diisi'],
        enum: ['Pre Event Day 1', 'Pre Event Day 2', 'Main Event'],
    },
    date: {
        type: Date,
        required: [true, 'Tanggal event harus diisi']
    },
    quota: {
        type: Number,
        required: [true, 'Kuota peserta harus diisi'],
        min: [1, 'Kuota minimal 1 peserta']
    },
    registeredCount: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'Harga tiket harus diisi'],
        min: [0, 'Harga tidak boleh negatif']
    },
    description: {
        type: String,
        trim: true
    },
    requireFoodAllergy: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

EventSchema.virtual('available').get(function () {
    return this.registeredCount < this.quota;
});

EventSchema.methods.checkAvailability = function () {
    return {
        available: this.registeredCount < this.quota,
        remainingSlots: Math.max(0, this.quota - this.registeredCount)
    };
};

module.exports = mongoose.model('Event', EventSchema);