require('dotenv').config();
const mongoose = require('mongoose');
const SuperAdmin = require('./models/SuperAdmin');

const createSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        // Check if super admin already exists
        const existingAdmin = await SuperAdmin.findOne({ email: 'admin@maktab.com' });

        if (existingAdmin) {
            console.log('Super Admin already exists!');
            console.log('Email: admin@maktab.com');
            process.exit(0);
        }

        // Create super admin
        const superAdmin = new SuperAdmin({
            username: 'superadmin',
            email: 'admin@maktab.com',
            password: 'Admin@123' // Change this password after first login
        });

        await superAdmin.save();

        console.log('\n✅ Super Admin created successfully!');
        console.log('=====================================');
        console.log('Email: admin@maktab.com');
        console.log('Password: Admin@123');
        console.log('=====================================');
        console.log('⚠️  Please change this password after first login!\n');

        process.exit(0);
    } catch (error) {
        console.error('Error creating super admin:', error.message);
        process.exit(1);
    }
};

createSuperAdmin();
