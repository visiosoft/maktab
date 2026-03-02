const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');
const CompanyAdmin = require('../models/CompanyAdmin');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role,
            company: user.company
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// @route   POST /api/auth/login
// @desc    Login for both Super Admin and Company Admin
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password, userType } = req.body;

        if (!email || !password || !userType) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        let user;

        if (userType === 'super_admin') {
            user = await SuperAdmin.findOne({ email });
        } else if (userType === 'company_admin') {
            user = await CompanyAdmin.findOne({ email }).populate('company');
        } else {
            return res.status(400).json({ message: 'Invalid user type' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is deactivated' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login for company admin
        if (userType === 'company_admin') {
            user.lastLogin = Date.now();
            await user.save();
        }

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                company: user.company
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   POST /api/auth/verify
// @desc    Verify token
// @access  Public
router.post('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ valid: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user;
        if (decoded.role === 'super_admin') {
            user = await SuperAdmin.findById(decoded.id).select('-password');
        } else if (decoded.role === 'company_admin') {
            user = await CompanyAdmin.findById(decoded.id).select('-password').populate('company');
        }

        if (!user || !user.isActive) {
            return res.status(401).json({ valid: false, message: 'User not found or inactive' });
        }

        res.json({
            valid: true,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                company: user.company
            }
        });
    } catch (error) {
        res.status(401).json({ valid: false, message: 'Invalid token' });
    }
});

module.exports = router;
