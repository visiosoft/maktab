const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
    message: { type: String, required: true },
    stack: { type: String },
    type: {
        type: String,
        enum: ['runtime', 'api', 'unhandled_rejection', 'network', 'unknown'],
        default: 'unknown'
    },
    url: { type: String },
    method: { type: String },
    statusCode: { type: Number },
    // User context
    userId: { type: String },
    userEmail: { type: String },
    userRole: { type: String },
    companyId: { type: String },
    // Browser/client info
    userAgent: { type: String },
    pageUrl: { type: String },
    // Extra payload
    meta: { type: mongoose.Schema.Types.Mixed },
    resolved: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-delete logs older than 90 days
errorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);
