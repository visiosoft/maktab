const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        enum: ['Makkah', 'Madinah'],
        required: true
    },
    phone: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'createdByModel',
        required: true
    },
    createdByModel: {
        type: String,
        required: true,
        enum: ['SuperAdmin', 'CompanyAdmin']
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
HotelSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index for faster searches
HotelSchema.index({ name: 1 });

module.exports = mongoose.model('Hotel', HotelSchema);
