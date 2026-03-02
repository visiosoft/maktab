const express = require('express');
const router = express.Router();
const { authMiddleware, isSuperAdmin } = require('../middleware/auth');
const SuperAdmin = require('../models/SuperAdmin');
const Company = require('../models/Company');
const CompanyAdmin = require('../models/CompanyAdmin');

// All routes require authentication and super admin role
router.use(authMiddleware);
router.use(isSuperAdmin);

// @route   GET /api/super-admin/dashboard
// @desc    Get dashboard statistics
// @access  Super Admin
router.get('/dashboard', async (req, res) => {
    try {
        const totalCompanies = await Company.countDocuments();
        const activeCompanies = await Company.countDocuments({ isActive: true });
        const totalCompanyAdmins = await CompanyAdmin.countDocuments();
        const activeCompanyAdmins = await CompanyAdmin.countDocuments({ isActive: true });

        const recentCompanies = await Company.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email isActive createdAt');

        res.json({
            stats: {
                totalCompanies,
                activeCompanies,
                totalCompanyAdmins,
                activeCompanyAdmins
            },
            recentCompanies
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Server error fetching dashboard data' });
    }
});

// @route   GET /api/super-admin/profile
// @desc    Get super admin profile
// @access  Super Admin
router.get('/profile', async (req, res) => {
    try {
        const admin = await SuperAdmin.findById(req.user.id).select('-password');
        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});

module.exports = router;
