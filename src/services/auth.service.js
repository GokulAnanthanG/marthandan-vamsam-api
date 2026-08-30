const User = require('../models/User.model');
const bcrypt = require('bcryptjs');

const registerUser = async (userData) => {
    // Check if user exists
    const existingUser = await User.findOne({ mobileNumber: userData.mobileNumber });
    if (existingUser) {
        throw new Error('Mobile number is already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // Create user
    const newUser = await User.create({
        ...userData,
        passwordHash
    });

    return newUser;
};

const authenticateUser = async (mobileNumber, password) => {
    const user = await User.findOne({ mobileNumber });
    if (!user) {
        throw new Error('Unregistered mobile number');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    if (user.status === 'BLOCKED') {
        throw new Error('User is blocked');
    }

    return user;
};

const getUserByMobile = async (mobileNumber) => {
    return User.findOne({ mobileNumber });
};

module.exports = {
    registerUser,
    authenticateUser,
    getUserByMobile
};
