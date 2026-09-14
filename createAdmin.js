require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User.model.js');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marthandan-vamsam');
        console.log('Connected to MongoDB');

        const mobileNumber = '9876543210';
        const password = 'AdminPassword123!';

        const existingUser = await User.findOne({ mobileNumber });
        if (existingUser) {
            console.log('User with this mobile number already exists.');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const adminUser = new User({
            fullName: 'Super Admin',
            mobileNumber: mobileNumber,
            passwordHash: passwordHash,
            dateOfBirth: new Date('1990-01-01'),
            gender: 'MALE',
            role: 'ADMIN',
            status: 'ACTIVE'
        });

        await adminUser.save();
        console.log('Admin user created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
