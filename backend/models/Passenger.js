const mongoose = require('mongoose');

const PassengerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    passportNo: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
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
PassengerSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index for faster searches
PassengerSchema.index({ company: 1, passportNo: 1 });

module.exports = mongoose.model('Passenger', PassengerSchema);
