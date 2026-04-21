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

// @route   GET /api/super-admin/passengers
// @desc    Get all passengers across all companies
// @access  Super Admin
router.get('/passengers', async (req, res) => {
    try {
        const { travelDate, travelType = 'any' } = req.query;
        let passengerQuery = {};

        if (travelDate) {
            const startOfDay = new Date(`${travelDate}T00:00:00.000Z`);
            const endOfDay = new Date(`${travelDate}T23:59:59.999Z`);
            const groupDateQuery = {};

            if (travelType === 'arrival') {
                groupDateQuery.arrivalDate = { $gte: startOfDay, $lte: endOfDay };
            } else if (travelType === 'departure') {
                groupDateQuery.departureDate = { $gte: startOfDay, $lte: endOfDay };
            } else {
                groupDateQuery.$or = [
                    { arrivalDate: { $gte: startOfDay, $lte: endOfDay } },
                    { departureDate: { $gte: startOfDay, $lte: endOfDay } }
                ];
            }

            const matchingGroups = await Group.find(groupDateQuery).select('_id');
            const matchingGroupIds = matchingGroups.map((group) => group._id);
            passengerQuery.group = { $in: matchingGroupIds };
        }

        const passengers = await Passenger.find(passengerQuery)
            .populate('company', 'name')
            .populate('createdBy', 'username email')
            .populate({
                path: 'group',
                select: 'groupName maktab company arrivalDate departureDate',
                populate: {
                    path: 'company',
                    select: 'name'
                }
            })
            .sort({ createdAt: -1 });

        res.json(passengers);
    } catch (error) {
        console.error('Error fetching passengers:', error);
        res.status(500).json({ message: 'Server error fetching passengers' });
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
            .sort({ arrivalDate: -1 });

        // Get passenger count for each group
        const groupsWithStats = await Promise.all(
            groups.map(async (group) => {
                const passengerCount = await Passenger.countDocuments({
                    group: group._id
                });
                return {
                    ...group.toObject(),
                    passengerCount
                };
            })
        );

        res.json(groupsWithStats);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ message: 'Server error fetching groups' });
    }
});

// @route   GET /api/super-admin/reports
// @desc    Get report data for a specific company or all companies
// @access  Super Admin
router.get('/reports', async (req, res) => {
    try {
        const { companyId } = req.query;
        console.log('[Super Admin Reports] Request received for companyId:', companyId);

        if (!companyId) {
            return res.status(400).json({ message: 'companyId is required' });
        }

        const isAll = companyId === 'all';

        // For a specific company, verify it exists
        let company = null;
        if (!isAll) {
            company = await Company.findById(companyId).select('name email');
            console.log('[Super Admin Reports] Company found:', company);
            if (!company) {
                return res.status(404).json({ message: 'Company not found' });
            }
        } else {
            company = { _id: 'all', name: 'All Companies' };
        }

        const groupQuery = isAll ? {} : { company: companyId };
        const groups = await Group.find(groupQuery)
            .populate('company', 'name')
            .populate('arrivalHotel', 'name city address')
            .populate('departureHotel', 'name city address')
            .sort({ arrivalDate: -1 });

        console.log('[Super Admin Reports] Groups found:', groups.length);

        const groupIds = groups.map((group) => group._id);
        const passengerQuery = groupIds.length
            ? { group: { $in: groupIds }, ...(isAll ? {} : { company: companyId }) }
            : null;

        const passengers = passengerQuery
            ? await Passenger.find(passengerQuery)
                .select('firstName lastName passportNo group company')
                .populate('company', 'name')
                .sort({ createdAt: 1 })
            : [];

        console.log('[Super Admin Reports] Passengers found:', passengers.length);

        const passengersByGroup = passengers.reduce((accumulator, passenger) => {
            const groupId = passenger.group?.toString();

            if (!groupId) {
                return accumulator;
            }

            if (!accumulator[groupId]) {
                accumulator[groupId] = [];
            }

            accumulator[groupId].push(passenger);
            return accumulator;
        }, {});

        const groupsWithPassengers = groups.map((group) => ({
            ...group.toObject(),
            passengers: passengersByGroup[group._id.toString()] || []
        }));

        console.log('[Super Admin Reports] Response data - company:', company.name, 'groups:', groupsWithPassengers.length);

        res.json({
            company,
            groups: groupsWithPassengers
        });
    } catch (error) {
        console.error('Error fetching report data:', error);
        res.status(500).json({ message: 'Server error fetching report data' });
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
