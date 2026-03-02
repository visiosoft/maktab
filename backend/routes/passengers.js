const express = require('express');
const router = express.Router();
const { authMiddleware, isCompanyAdmin } = require('../middleware/auth');
const Passenger = require('../models/Passenger');
const CompanyAdmin = require('../models/CompanyAdmin');

// All routes require authentication and company admin role
router.use(authMiddleware);
router.use(isCompanyAdmin);

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

// @route   POST /api/passengers/bulk
// @desc    Create multiple passengers at once
// @access  Company Admin
router.post('/bulk', async (req, res) => {
    try {
        const { passengers } = req.body;

        if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
            return res.status(400).json({ message: 'Passengers array is required' });
        }

        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const createdPassengers = [];
        const errors = [];

        for (let i = 0; i < passengers.length; i++) {
            const passengerData = passengers[i];

            if (!passengerData.firstName || !passengerData.lastName || !passengerData.passportNo) {
                errors.push({ index: i, message: 'Missing required fields' });
                continue;
            }

            // Check if passport already exists
            const existing = await Passenger.findOne({
                company: admin.company,
                passportNo: passengerData.passportNo.toUpperCase()
            });

            if (existing) {
                errors.push({ index: i, message: 'Passport number already exists' });
                continue;
            }

            const passenger = new Passenger({
                ...passengerData,
                passportNo: passengerData.passportNo.toUpperCase(),
                company: admin.company,
                createdBy: req.user.id
            });

            await passenger.save();
            createdPassengers.push(passenger);
        }

        res.status(201).json({
            message: `Created ${createdPassengers.length} passengers`,
            created: createdPassengers.length,
            errors: errors.length,
            errorDetails: errors
        });
    } catch (error) {
        console.error('Bulk create passengers error:', error);
        res.status(500).json({ message: 'Server error creating passengers' });
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

// @route   GET /api/passengers/stats
// @desc    Get passenger statistics for the company
// @access  Company Admin
router.get('/stats', async (req, res) => {
    try {
        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const totalPassengers = await Passenger.countDocuments({ company: admin.company });

        res.json({
            totalPassengers
        });
    } catch (error) {
        console.error('Get passenger stats error:', error);
        res.status(500).json({ message: 'Server error fetching passenger statistics' });
    }
});

module.exports = router;
