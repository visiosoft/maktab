const express = require('express');
const router = express.Router();
const { authMiddleware, isSuperAdmin, isCompanyAdmin } = require('../middleware/auth');
const Company = require('../models/Company');
const CompanyAdmin = require('../models/CompanyAdmin');

// @route   GET /api/companies
// @desc    Get all companies (Super Admin) or own company (Company Admin)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role === 'super_admin') {
            const companies = await Company.find()
                .populate('createdBy', 'username email')
                .sort({ createdAt: -1 });
            res.json(companies);
        } else if (req.user.role === 'company_admin') {
            const admin = await CompanyAdmin.findById(req.user.id).populate('company');
            res.json(admin.company);
        } else {
            res.status(403).json({ message: 'Access denied' });
        }
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ message: 'Server error fetching companies' });
    }
});

// @route   POST /api/companies
// @desc    Create a new company
// @access  Super Admin
router.post('/', authMiddleware, isSuperAdmin, async (req, res) => {
    try {
        const { name, email, phone, address, industry, website } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Company name and email are required' });
        }

        // Check if company email already exists
        const existingCompany = await Company.findOne({ email });
        if (existingCompany) {
            return res.status(400).json({ message: 'Company with this email already exists' });
        }

        const company = new Company({
            name,
            email,
            phone,
            address,
            industry,
            website,
            createdBy: req.user.id
        });

        await company.save();

        const populatedCompany = await Company.findById(company._id)
            .populate('createdBy', 'username email');

        res.status(201).json({
            message: 'Company created successfully',
            company: populatedCompany
        });
    } catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({ message: 'Server error creating company' });
    }
});

// @route   GET /api/companies/:id
// @desc    Get company by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('createdBy', 'username email');

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check authorization
        if (req.user.role === 'company_admin') {
            const admin = await CompanyAdmin.findById(req.user.id);
            if (admin.company.toString() !== company._id.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        res.json(company);
    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ message: 'Server error fetching company' });
    }
});

// @route   PUT /api/companies/:id
// @desc    Update company
// @access  Super Admin
router.put('/:id', authMiddleware, isSuperAdmin, async (req, res) => {
    try {
        const { name, email, phone, address, industry, website, isActive } = req.body;

        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== company.email) {
            const existingCompany = await Company.findOne({ email });
            if (existingCompany) {
                return res.status(400).json({ message: 'Company with this email already exists' });
            }
        }

        if (name) company.name = name;
        if (email) company.email = email;
        if (phone !== undefined) company.phone = phone;
        if (address) company.address = { ...company.address, ...address };
        if (industry !== undefined) company.industry = industry;
        if (website !== undefined) company.website = website;
        if (isActive !== undefined) company.isActive = isActive;

        await company.save();

        const updatedCompany = await Company.findById(company._id)
            .populate('createdBy', 'username email');

        res.json({
            message: 'Company updated successfully',
            company: updatedCompany
        });
    } catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({ message: 'Server error updating company' });
    }
});

// @route   DELETE /api/companies/:id
// @desc    Delete company
// @access  Super Admin
router.delete('/:id', authMiddleware, isSuperAdmin, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Delete all company admins associated with this company
        await CompanyAdmin.deleteMany({ company: req.params.id });

        await Company.findByIdAndDelete(req.params.id);

        res.json({ message: 'Company and associated admins deleted successfully' });
    } catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({ message: 'Server error deleting company' });
    }
});

// @route   GET /api/companies/:id/admins
// @desc    Get all admins for a company
// @access  Private
router.get('/:id/admins', authMiddleware, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check authorization
        if (req.user.role === 'company_admin') {
            const admin = await CompanyAdmin.findById(req.user.id);
            if (admin.company.toString() !== company._id.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        const admins = await CompanyAdmin.find({ company: req.params.id })
            .populate('company', 'name email')
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(admins);
    } catch (error) {
        console.error('Get company admins error:', error);
        res.status(500).json({ message: 'Server error fetching company admins' });
    }
});

// @route   POST /api/companies/:id/admins
// @desc    Create admin for a company
// @access  Super Admin
router.post('/:id/admins', authMiddleware, isSuperAdmin, async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, phone } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }

        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if admin email already exists
        const existingAdmin = await CompanyAdmin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin with this email already exists' });
        }

        const companyAdmin = new CompanyAdmin({
            username,
            email,
            password,
            firstName,
            lastName,
            phone,
            company: req.params.id,
            createdBy: req.user.id
        });

        await companyAdmin.save();

        const populatedAdmin = await CompanyAdmin.findById(companyAdmin._id)
            .populate('company', 'name email')
            .select('-password');

        res.status(201).json({
            message: 'Company admin created successfully',
            admin: populatedAdmin
        });
    } catch (error) {
        console.error('Create company admin error:', error);
        res.status(500).json({ message: 'Server error creating company admin' });
    }
});

// @route   PUT /api/companies/:companyId/admins/:adminId
// @desc    Update company admin
// @access  Super Admin
router.put('/:companyId/admins/:adminId', authMiddleware, isSuperAdmin, async (req, res) => {
    try {
        const { username, email, firstName, lastName, phone, isActive } = req.body;

        const admin = await CompanyAdmin.findById(req.params.adminId);

        if (!admin) {
            return res.status(404).json({ message: 'Company admin not found' });
        }

        if (admin.company.toString() !== req.params.companyId) {
            return res.status(400).json({ message: 'Admin does not belong to this company' });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== admin.email) {
            const existingAdmin = await CompanyAdmin.findOne({ email });
            if (existingAdmin) {
                return res.status(400).json({ message: 'Admin with this email already exists' });
            }
        }

        if (username) admin.username = username;
        if (email) admin.email = email;
        if (firstName !== undefined) admin.firstName = firstName;
        if (lastName !== undefined) admin.lastName = lastName;
        if (phone !== undefined) admin.phone = phone;
        if (isActive !== undefined) admin.isActive = isActive;

        await admin.save();

        const updatedAdmin = await CompanyAdmin.findById(admin._id)
            .populate('company', 'name email')
            .select('-password');

        res.json({
            message: 'Company admin updated successfully',
            admin: updatedAdmin
        });
    } catch (error) {
        console.error('Update company admin error:', error);
        res.status(500).json({ message: 'Server error updating company admin' });
    }
});

// @route   DELETE /api/companies/:companyId/admins/:adminId
// @desc    Delete company admin
// @access  Super Admin
router.delete('/:companyId/admins/:adminId', authMiddleware, isSuperAdmin, async (req, res) => {
    try {
        const admin = await CompanyAdmin.findById(req.params.adminId);

        if (!admin) {
            return res.status(404).json({ message: 'Company admin not found' });
        }

        if (admin.company.toString() !== req.params.companyId) {
            return res.status(400).json({ message: 'Admin does not belong to this company' });
        }

        await CompanyAdmin.findByIdAndDelete(req.params.adminId);

        res.json({ message: 'Company admin deleted successfully' });
    } catch (error) {
        console.error('Delete company admin error:', error);
        res.status(500).json({ message: 'Server error deleting company admin' });
    }
});

module.exports = router;
