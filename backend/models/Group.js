const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
        trim: true
    },
    arrivalDate: {
        type: Date,
        required: true
    },
    arrivalAirport: {
        type: String,
        required: true,
        trim: true
    },
    arrivalFlightNo: {
        type: String,
        required: true,
        trim: true
    },
    arrivalCity: {
        type: String,
        enum: ['Makkah', 'Madinah'],
        required: true
    },
    departureDate: {
        type: Date,
        required: true
    },
    departureAirport: {
        type: String,
        required: true,
        trim: true
    },
    departureFlightNo: {
        type: String,
        required: true,
        trim: true
    },
    departureCity: {
        type: String,
        enum: ['Makkah', 'Madinah'],
        required: true
    },
    arrivalHotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true
    },
    departureHotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true
    },
    maktab: {
        type: String,
        enum: ['A', 'B', 'C', 'D'],
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CompanyAdmin',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
GroupSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual field for backward compatibility - 'hotel' maps to 'arrivalHotel'
GroupSchema.virtual('hotel').get(function () {
    return this.arrivalHotel;
});

// Ensure virtuals are included in JSON
GroupSchema.set('toJSON', { virtuals: true });
GroupSchema.set('toObject', { virtuals: true });

// Index for faster searches
GroupSchema.index({ company: 1, groupName: 1 });

module.exports = mongoose.model('Group', GroupSchema);
