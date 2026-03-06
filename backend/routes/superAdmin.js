const express = require('express');
const router = express.Router();
const { authMiddleware, isSuperAdmin } = require('../middleware/auth');
const SuperAdmin = require('../models/SuperAdmin');
const Company = require('../models/Company');
const CompanyAdmin = require('../models/CompanyAdmin');
const Passenger = require('../models/Passenger');
const Group = require('../models/Group');

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

// @route   GET /api/super-admin/passenger-counts
// @desc    Get passenger counts per company
// @access  Super Admin
router.get('/passenger-counts', async (req, res) => {
    try {
        const passengers = await Passenger.find().select('company');

        // Count passengers per company
        const counts = {};
        passengers.forEach(passenger => {
            if (passenger.company) {
                const companyId = passenger.company.toString();
                counts[companyId] = (counts[companyId] || 0) + 1;
            }
        });

        res.json(counts);
    } catch (error) {
        console.error('Error fetching passenger counts:', error);
        res.status(500).json({ message: 'Server error fetching passenger counts' });
    }
});

// @route   GET /api/super-admin/groups
// @desc    Get all groups across all companies
// @access  Super Admin
router.get('/groups', async (req, res) => {
    try {
        const groups = await Group.find()
            .populate('company', 'name')
            .populate('arrivalHotel', 'name')
            .populate('departureHotel', 'name')
            .populate('hotel', 'name')
            .sort({ arrivalDate: -1 });

        res.json(groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ message: 'Server error fetching groups' });
    }
});

// @route   GET /api/super-admin/unassigned-counts
// @desc    Get unassigned passenger counts per company
// @access  Super Admin
router.get('/unassigned-counts', async (req, res) => {
    try {
        const passengers = await Passenger.find().select('company group').populate('group', 'maktab');

        // Count unassigned passengers per company
        const counts = {};
        passengers.forEach(passenger => {
            if (passenger.company) {
                const companyId = passenger.company.toString();
                // Count as unassigned if no group or no maktab
                if (!passenger.group || !passenger.group.maktab) {
                    counts[companyId] = (counts[companyId] || 0) + 1;
                }
            }
        });

        res.json(counts);
    } catch (error) {
        console.error('Error fetching unassigned counts:', error);
        res.status(500).json({ message: 'Server error fetching unassigned counts' });
    }
});

module.exports = router;
