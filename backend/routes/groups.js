const express = require('express');
const router = express.Router();
const { authMiddleware, isCompanyAdmin } = require('../middleware/auth');
const Group = require('../models/Group');
const Hotel = require('../models/Hotel');
const Passenger = require('../models/Passenger');
const CompanyAdmin = require('../models/CompanyAdmin');

// All routes require authentication and company admin role
router.use(authMiddleware);
router.use(isCompanyAdmin);

// @route   GET /api/groups
// @desc    Get all groups for the company admin's company
// @access  Company Admin
router.get('/', async (req, res) => {
    try {
        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const groups = await Group.find({ company: admin.company })
            .populate('hotel', 'name city')
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 });

        // Get passenger count for each group
        const groupsWithStats = await Promise.all(
            groups.map(async (group) => {
                const passengerCount = await Passenger.countDocuments({
                    group: group._id,
                    company: admin.company
                });
                return {
                    ...group.toObject(),
                    passengerCount
                };
            })
        );

        res.json(groupsWithStats);
    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({ message: 'Server error fetching groups' });
    }
});

// @route   GET /api/groups/:id
// @desc    Get a single group by ID
// @access  Company Admin
router.get('/:id', async (req, res) => {
    try {
        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const group = await Group.findById(req.params.id)
            .populate('hotel', 'name city address phone')
            .populate('createdBy', 'username email');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if group belongs to the admin's company
        if (group.company.toString() !== admin.company.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const passengerCount = await Passenger.countDocuments({
            group: group._id,
            company: admin.company
        });

        res.json({
            ...group.toObject(),
            passengerCount
        });
    } catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({ message: 'Server error fetching group' });
    }
});

// @route   POST /api/groups
// @desc    Create a new group
// @access  Company Admin
router.post('/', async (req, res) => {
    try {
        const {
            groupName,
            numberOfPax,
            arrivalDate,
            arrivalAirport,
            arrivalFlightNo,
            departureDate,
            departureAirport,
            departureFlightNo,
            hotel,
            maktab
        } = req.body;

        if (!groupName) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        if (!maktab) {
            return res.status(400).json({ message: 'Maktab is required' });
        }

        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Validate hotel if provided
        if (hotel) {
            const hotelExists = await Hotel.findOne({
                _id: hotel,
                company: admin.company
            });
            if (!hotelExists) {
                return res.status(400).json({ message: 'Invalid hotel selection' });
            }
        }

        const group = new Group({
            groupName,
            numberOfPax,
            arrivalDate,
            arrivalAirport,
            arrivalFlightNo,
            departureDate,
            departureAirport,
            departureFlightNo,
            hotel,
            maktab,
            company: admin.company,
            createdBy: req.user.id
        });

        await group.save();

        const populatedGroup = await Group.findById(group._id)
            .populate('hotel', 'name city address phone')
            .populate('createdBy', 'username email');

        res.status(201).json({
            message: 'Group created successfully',
            group: populatedGroup
        });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ message: 'Server error creating group' });
    }
});

// @route   PUT /api/groups/:id
// @desc    Update a group
// @access  Company Admin
router.put('/:id', async (req, res) => {
    try {
        const {
            groupName,
            numberOfPax,
            arrivalDate,
            arrivalAirport,
            arrivalFlightNo,
            departureDate,
            departureAirport,
            departureFlightNo,
            hotel,
            maktab
        } = req.body;

        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if group belongs to the admin's company
        if (group.company.toString() !== admin.company.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Validate hotel if provided
        if (hotel) {
            const hotelExists = await Hotel.findOne({
                _id: hotel,
                company: admin.company
            });
            if (!hotelExists) {
                return res.status(400).json({ message: 'Invalid hotel selection' });
            }
        }

        if (groupName !== undefined) group.groupName = groupName;
        if (numberOfPax !== undefined) group.numberOfPax = numberOfPax;
        if (arrivalDate !== undefined) group.arrivalDate = arrivalDate;
        if (arrivalAirport !== undefined) group.arrivalAirport = arrivalAirport;
        if (arrivalFlightNo !== undefined) group.arrivalFlightNo = arrivalFlightNo;
        if (departureDate !== undefined) group.departureDate = departureDate;
        if (departureAirport !== undefined) group.departureAirport = departureAirport;
        if (departureFlightNo !== undefined) group.departureFlightNo = departureFlightNo;
        if (hotel !== undefined) group.hotel = hotel;
        if (maktab !== undefined) group.maktab = maktab;

        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate('hotel', 'name city address phone')
            .populate('createdBy', 'username email');

        res.json({
            message: 'Group updated successfully',
            group: updatedGroup
        });
    } catch (error) {
        console.error('Update group error:', error);
        res.status(500).json({ message: 'Server error updating group' });
    }
});

// @route   DELETE /api/groups/:id
// @desc    Delete a group
// @access  Company Admin
router.delete('/:id', async (req, res) => {
    try {
        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if group belongs to the admin's company
        if (group.company.toString() !== admin.company.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Unassign all passengers from this group
        await Passenger.updateMany(
            { group: req.params.id },
            { $unset: { group: 1 } }
        );

        await Group.findByIdAndDelete(req.params.id);

        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({ message: 'Server error deleting group' });
    }
});

// @route   GET /api/groups/:id/passengers
// @desc    Get all passengers in a group
// @access  Company Admin
router.get('/:id/passengers', async (req, res) => {
    try {
        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if group belongs to the admin's company
        if (group.company.toString() !== admin.company.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const passengers = await Passenger.find({
            group: req.params.id,
            company: admin.company
        }).sort({ createdAt: 1 });

        res.json(passengers);
    } catch (error) {
        console.error('Get group passengers error:', error);
        res.status(500).json({ message: 'Server error fetching passengers' });
    }
});

// @route   PUT /api/groups/assign-passengers
// @desc    Assign multiple passengers to a group
// @access  Company Admin
router.put('/assign-passengers', async (req, res) => {
    try {
        const { passengerIds, groupId } = req.body;

        if (!passengerIds || !Array.isArray(passengerIds) || passengerIds.length === 0) {
            return res.status(400).json({ message: 'Passenger IDs are required' });
        }

        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Validate group if provided
        if (groupId) {
            const group = await Group.findOne({
                _id: groupId,
                company: admin.company
            });
            if (!group) {
                return res.status(400).json({ message: 'Invalid group selection' });
            }
        }

        // Update passengers
        const result = await Passenger.updateMany(
            {
                _id: { $in: passengerIds },
                company: admin.company
            },
            groupId ? { group: groupId } : { $unset: { group: 1 } }
        );

        res.json({
            message: `${result.modifiedCount} passenger(s) updated successfully`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Assign passengers error:', error);
        res.status(500).json({ message: 'Server error assigning passengers' });
    }
});

module.exports = router;
