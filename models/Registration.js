const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Nama lengkap harus diisi'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email harus diisi'],
        match: [
            /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
            'Email tidak valid'
        ],
        lowercase: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Nomor HP harus diisi'],
        match: [/^(\+\d{1,3}[- ]?)?\d{10,14}$/, 'Nomor HP tidak valid']
    },
    gender: {
        type: String,
        required: [true, 'Gender harus diisi'],
        enum: ['Laki-laki', 'Perempuan']
    },
    age: {
        type: Number,
        required: [true, 'Usia harus diisi'],
        min: [0, 'Usia tidak valid']
    },
    foodAllergy: {
        type: String,
        default: '-'
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled', 'expired'],
        default: 'pending'
    },
    registrationNumber: {
        type: String,
        unique: true
    },
    qrCode: {
        type: String
    },
    attendanceStatus: {
        type: String,
        enum: ['not_attended', 'attended'],
        default: 'not_attended'
    }
}, {
    timestamps: true
});

RegistrationSchema.pre('save', async function (next) {
    if (!this.registrationNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const Event = mongoose.model('Event');
        const event = await Event.findById(this.eventId);
        let prefix = 'EV';

        if (event) {
            if (event.type === 'Pre Event Day 1') prefix = 'TEDxUC-PRE1';
            else if (event.type === 'Pre Event Day 2') prefix = 'TEDxUC-PRE2';
            else if (event.type === 'Main Event') prefix = 'TEDxUC-MAIN';
        }

        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        this.registrationNumber = `${prefix}-${year}${month}${day}-${random}`;
    }
    next();
});

module.exports = mongoose.model('Registration', RegistrationSchema);