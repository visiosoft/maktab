const express = require('express');
const router = express.Router();
const ErrorLog = require('../models/ErrorLog');
const { authMiddleware, isSuperAdmin } = require('../middleware/auth');

// POST /api/error-logs - Save an error log (no auth required so errors from logged-out users are captured)
router.post('/', async (req, res) => {
    try {
        const { message, stack, type, url, method, statusCode, userId, userEmail, userRole, companyId, userAgent, pageUrl, meta } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Error message is required' });
        }

        const errorLog = new ErrorLog({
            message: String(message).substring(0, 2000),
            stack: stack ? String(stack).substring(0, 5000) : undefined,
            type,
            url,
            method,
            statusCode,
            userId,
            userEmail,
            userRole,
            companyId,
            userAgent: userAgent || req.headers['user-agent'],
            pageUrl,
            meta,
        });

        await errorLog.save();
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Failed to save error log:', error);
        res.status(500).json({ message: 'Failed to save error log' });
    }
});

// GET /api/error-logs - Get all error logs (super admin only)
router.get('/', authMiddleware, isSuperAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, type, resolved, search } = req.query;
        const filter = {};

        if (type) filter.type = type;
        if (resolved !== undefined) filter.resolved = resolved === 'true';
        if (search) {
            filter.$or = [
                { message: { $regex: search, $options: 'i' } },
                { userEmail: { $regex: search, $options: 'i' } },
                { pageUrl: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await ErrorLog.countDocuments(filter);
        const logs = await ErrorLog.find(filter)
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            logs,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
        });
    } catch (error) {
        console.error('Failed to fetch error logs:', error);
        res.status(500).json({ message: 'Failed to fetch error logs' });
    }
});

// PUT /api/error-logs/:id/resolve - Toggle resolved status
router.put('/:id/resolve', authMiddleware, isSuperAdmin, async (req, res) => {
    try {
        const log = await ErrorLog.findById(req.params.id);
        if (!log) return res.status(404).json({ message: 'Error log not found' });

        log.resolved = !log.resolved;
        await log.save();
        res.json(log);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update error log' });
    }
});

// DELETE /api/error-logs/clear - Clear all resolved logs
router.delete('/clear', authMiddleware, isSuperAdmin, async (req, res) => {
    try {
        const result = await ErrorLog.deleteMany({ resolved: true });
        res.json({ deleted: result.deletedCount });
    } catch (error) {
        res.status(500).json({ message: 'Failed to clear error logs' });
    }
});

module.exports = router;
