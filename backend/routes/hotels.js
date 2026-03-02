const express = require('express');
const router = express.Router();
const { authMiddleware, isSuperAdmin, isCompanyAdmin, isAdmin } = require('../middleware/auth');
const Hotel = require('../models/Hotel');
const SuperAdmin = require('../models/SuperAdmin');
const CompanyAdmin = require('../models/CompanyAdmin');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/hotels
// @desc    Get all hotels (generic for all companies)
// @access  Super Admin, Company Admin
router.get('/', isAdmin, async (req, res) => {
    try {
        const hotels = await Hotel.find()
            .populate('createdBy', 'username email')
            .sort({ name: 1 });

        res.json(hotels);
    } catch (error) {
        console.error('Get hotels error:', error);
        res.status(500).json({ message: 'Server error fetching hotels' });
    }
});

// @route   POST /api/hotels
// @desc    Create a new hotel
// @access  Super Admin
router.post('/', isSuperAdmin, async (req, res) => {
    try {
        const { name, address, city, phone } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Hotel name is required' });
        }

        const hotel = new Hotel({
            name,
            address,
            city,
            phone,
            createdBy: req.user.id,
            createdByModel: 'SuperAdmin'
        });

        await hotel.save();

        const populatedHotel = await Hotel.findById(hotel._id)
            .populate('createdBy', 'username email');

        res.status(201).json({
            message: 'Hotel created successfully',
            hotel: populatedHotel
        });
    } catch (error) {
        console.error('Create hotel error:', error);
        res.status(500).json({ message: 'Server error creating hotel' });
    }
});

// @route   PUT /api/hotels/:id
// @desc    Update a hotel
// @access  Super Admin
router.put('/:id', isSuperAdmin, async (req, res) => {
    try {
        const { name, address, city, phone } = req.body;

        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        if (name) hotel.name = name;
        if (address !== undefined) hotel.address = address;
        if (city !== undefined) hotel.city = city;
        if (phone !== undefined) hotel.phone = phone;

        await hotel.save();

        const updatedHotel = await Hotel.findById(hotel._id)
            .populate('createdBy', 'username email');

        res.json({
            message: 'Hotel updated successfully',
            hotel: updatedHotel
        });
    } catch (error) {
        console.error('Update hotel error:', error);
        res.status(500).json({ message: 'Server error updating hotel' });
    }
});

// @route   DELETE /api/hotels/:id
// @desc    Delete a hotel
// @access  Super Admin
router.delete('/:id', isSuperAdmin, async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        await Hotel.findByIdAndDelete(req.params.id);

        res.json({ message: 'Hotel deleted successfully' });
    } catch (error) {
        console.error('Delete hotel error:', error);
        res.status(500).json({ message: 'Server error deleting hotel' });
    }
});

module.exports = router;
