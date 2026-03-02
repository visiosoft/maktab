const express = require('express');
const router = express.Router();
const { authMiddleware, isCompanyAdmin } = require('../middleware/auth');
const Passenger = require('../models/Passenger');
const CompanyAdmin = require('../models/CompanyAdmin');
const Company = require('../models/Company');

// All routes require authentication and company admin role
router.use(authMiddleware);
router.use(isCompanyAdmin);

// IMPORTANT: Specific routes must be defined BEFORE general routes
// Otherwise Express will match the general route first

// @route   GET /api/passengers/stats
// @desc    Get passenger statistics for the company
// @access  Company Admin
router.get('/stats', async (req, res) => {
    try {
        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const company = await Company.findById(admin.company);
        const totalPassengers = await Passenger.countDocuments({ company: admin.company });

        // Get passengers with groups populated
        const passengers = await Passenger.find({ company: admin.company })
            .populate('group', 'maktab');

        // Count passengers by Maktab
        const maktabCounts = {
            A: 0,
            B: 0,
            C: 0,
            D: 0,
            unassigned: 0
        };

        passengers.forEach(passenger => {
            if (passenger.group && passenger.group.maktab) {
                maktabCounts[passenger.group.maktab]++;
            } else {
                maktabCounts.unassigned++;
            }
        });

        res.json({
            totalPassengers,
            quota: company.passengerQuota,
            remaining: company.passengerQuota - totalPassengers,
            maktabCounts
        });
    } catch (error) {
        console.error('Get passenger stats error:', error);
        res.status(500).json({ message: 'Server error fetching passenger statistics' });
    }
});

// @route   GET /api/passengers/unassigned
// @desc    Get all passengers without a group
// @access  Company Admin
router.get('/unassigned', async (req, res) => {
    try {
        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const passengers = await Passenger.find({
            company: admin.company,
            $or: [
                { group: { $exists: false } },
                { group: null }
            ]
        })
        .sort({ createdAt: -1 });

        res.json(passengers);
    } catch (error) {
        console.error('Get unassigned passengers error:', error);
        res.status(500).json({ message: 'Server error fetching unassigned passengers' });
    }
});

// @route   POST /api/passengers/bulk-import
// @desc    Create multiple passengers at once from CSV import
// @access  Company Admin
router.post('/bulk-import', async (req, res) => {
    try {
        const { passengers } = req.body;

        console.log('Bulk import request received:', passengers?.length, 'passengers');

        if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
            return res.status(400).json({ message: 'Passengers array is required' });
        }

        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check company quota
        const company = await Company.findById(admin.company);
        const currentPassengerCount = await Passenger.countDocuments({ company: admin.company });
        const availableSlots = company.passengerQuota - currentPassengerCount;

        if (availableSlots <= 0) {
            return res.status(403).json({ 
                message: `Passenger quota reached. Your company quota is ${company.passengerQuota} passengers.`,
                quota: company.passengerQuota,
                current: currentPassengerCount
            });
        }

        const createdPassengers = [];
        const errors = [];

        for (let i = 0; i < passengers.length; i++) {
            const passengerData = passengers[i];

            // Check if quota reached
            if (currentPassengerCount + createdPassengers.length >= company.passengerQuota) {
                errors.push({ index: i + 1, message: 'Quota limit reached', data: passengerData });
                continue;
            }

            if (!passengerData.firstName || !passengerData.lastName || !passengerData.passportNo) {
                errors.push({ index: i + 1, message: 'Missing required fields', data: passengerData });
                continue;
            }

            // Check if passport already exists
            const existing = await Passenger.findOne({
                company: admin.company,
                passportNo: passengerData.passportNo.toUpperCase()
            });

            if (existing) {
                errors.push({ index: i + 1, message: 'Passport number already exists', passportNo: passengerData.passportNo });
                continue;
            }

            const newPassengerData = {
                firstName: passengerData.firstName,
                lastName: passengerData.lastName,
                passportNo: passengerData.passportNo.toUpperCase(),
                company: admin.company,
                createdBy: req.user.id
            };

            // Add group if provided
            if (passengerData.group) {
                newPassengerData.group = passengerData.group;
            }

            const passenger = new Passenger(newPassengerData);

            await passenger.save();
            createdPassengers.push(passenger);
        }

        console.log('Bulk import completed:', createdPassengers.length, 'success,', errors.length, 'failed');

        res.status(201).json({
            message: `Successfully imported ${createdPassengers.length} passengers${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
            success: createdPassengers.length,
            failed: errors.length,
            errors: errors
        });
    } catch (error) {
        console.error('Bulk import passengers error:', error);
        res.status(500).json({ message: 'Server error importing passengers' });
    }
});

// @route   GET /api/passengers
// @desc    Get all passengers for the company admin's company
// @access  Company Admin
router.get('/', async (req, res) => {
    try {
        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const passengers = await Passenger.find({ company: admin.company })
            .populate('createdBy', 'username email')
            .populate('group', 'groupName')
            .sort({ createdAt: -1 });

        res.json(passengers);
    } catch (error) {
        console.error('Get passengers error:', error);
        res.status(500).json({ message: 'Server error fetching passengers' });
    }
});

// @route   POST /api/passengers
// @desc    Create a new passenger
// @access  Company Admin
router.post('/', async (req, res) => {
    try {
        const { firstName, lastName, passportNo, group } = req.body;

        console.log('Received passenger data:', { firstName, lastName, passportNo, group });

        if (!firstName || !lastName || !passportNo) {
            console.log('Validation failed - missing fields');
            return res.status(400).json({ message: 'First name, last name, and passport number are required' });
        }

        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            console.log('Admin not found');
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check company quota
        const company = await Company.findById(admin.company);
        const currentPassengerCount = await Passenger.countDocuments({ company: admin.company });
        
        if (currentPassengerCount >= company.passengerQuota) {
            return res.status(403).json({ 
                message: `Passenger quota reached. Your company quota is ${company.passengerQuota} passengers.`,
                quota: company.passengerQuota,
                current: currentPassengerCount
            });
        }

        // Check if passport number already exists for this company
        const existingPassenger = await Passenger.findOne({
            company: admin.company,
            passportNo: passportNo.toUpperCase()
        });

        if (existingPassenger) {
            console.log('Duplicate passport number:', passportNo);
            return res.status(400).json({ message: 'Passenger with this passport number already exists' });
        }

        const passengerData = {
            firstName,
            lastName,
            passportNo: passportNo.toUpperCase(),
            company: admin.company,
            createdBy: req.user.id
        };

        // Add group if provided
        if (group) {
            passengerData.group = group;
        }

        const passenger = new Passenger(passengerData);

        await passenger.save();

        const populatedPassenger = await Passenger.findById(passenger._id)
            .populate('createdBy', 'username email');

        console.log('Passenger created successfully:', populatedPassenger._id);

        res.status(201).json({
            message: 'Passenger created successfully',
            passenger: populatedPassenger
        });
    } catch (error) {
        console.error('Create passenger error:', error);
        res.status(500).json({ message: 'Server error creating passenger' });
    }
});

// @route   PUT /api/passengers/:id
// @desc    Update a passenger
// @access  Company Admin
router.put('/:id', async (req, res) => {
    try {
        const { firstName, lastName, passportNo, group } = req.body;

        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const passenger = await Passenger.findById(req.params.id);

        if (!passenger) {
            return res.status(404).json({ message: 'Passenger not found' });
        }

        // Check if passenger belongs to the admin's company
        if (passenger.company.toString() !== admin.company.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if passport number is being changed and if it already exists
        if (passportNo && passportNo.toUpperCase() !== passenger.passportNo) {
            const existingPassenger = await Passenger.findOne({
                company: admin.company,
                passportNo: passportNo.toUpperCase(),
                _id: { $ne: req.params.id }
            });

            if (existingPassenger) {
                return res.status(400).json({ message: 'Passenger with this passport number already exists' });
            }
        }

        if (firstName) passenger.firstName = firstName;
        if (lastName) passenger.lastName = lastName;
        if (passportNo) passenger.passportNo = passportNo.toUpperCase();
        if (group !== undefined) passenger.group = group || null;

        await passenger.save();

        const updatedPassenger = await Passenger.findById(passenger._id)
            .populate('createdBy', 'username email');

        res.json({
            message: 'Passenger updated successfully',
            passenger: updatedPassenger
        });
    } catch (error) {
        console.error('Update passenger error:', error);
        res.status(500).json({ message: 'Server error updating passenger' });
    }
});

// @route   DELETE /api/passengers/:id
// @desc    Delete a passenger
// @access  Company Admin
router.delete('/:id', async (req, res) => {
    try {
        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const passenger = await Passenger.findById(req.params.id);

        if (!passenger) {
            return res.status(404).json({ message: 'Passenger not found' });
        }

        // Check if passenger belongs to the admin's company
        if (passenger.company.toString() !== admin.company.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Passenger.findByIdAndDelete(req.params.id);

        res.json({ message: 'Passenger deleted successfully' });
    } catch (error) {
        console.error('Delete passenger error:', error);
        res.status(500).json({ message: 'Server error deleting passenger' });
    }
});

module.exports = router;
