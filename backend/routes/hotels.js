const express = require('express');
const router = express.Router();
const { authMiddleware, isCompanyAdmin } = require('../middleware/auth');
const Hotel = require('../models/Hotel');
const CompanyAdmin = require('../models/CompanyAdmin');

// All routes require authentication and company admin role
router.use(authMiddleware);
router.use(isCompanyAdmin);

// @route   GET /api/hotels
// @desc    Get all hotels for the company admin's company
// @access  Company Admin
router.get('/', async (req, res) => {
    try {
        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const hotels = await Hotel.find({ company: admin.company })
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
// @access  Company Admin
router.post('/', async (req, res) => {
    try {
        const { name, address, city, phone } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Hotel name is required' });
        }

        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const hotel = new Hotel({
            name,
            address,
            city,
            phone,
            company: admin.company,
            createdBy: req.user.id
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
// @access  Company Admin
router.put('/:id', async (req, res) => {
    try {
        const { name, address, city, phone } = req.body;

        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        // Check if hotel belongs to the admin's company
        if (hotel.company.toString() !== admin.company.toString()) {
            return res.status(403).json({ message: 'Access denied' });
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
// @access  Company Admin
router.delete('/:id', async (req, res) => {
    try {
        const admin = await CompanyAdmin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        // Check if hotel belongs to the admin's company
        if (hotel.company.toString() !== admin.company.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Hotel.findByIdAndDelete(req.params.id);

        res.json({ message: 'Hotel deleted successfully' });
    } catch (error) {
        console.error('Delete hotel error:', error);
        res.status(500).json({ message: 'Server error deleting hotel' });
    }
});

module.exports = router;
