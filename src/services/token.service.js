const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken.model');

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, status: user.status },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' }
    );
};

const generateRefreshToken = async (user) => {
    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    // Save refresh token to DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await RefreshToken.create({
        token,
        user: user._id,
        expiresAt
    });

    return token;
};

const revokeRefreshToken = async (token) => {
    return RefreshToken.findOneAndUpdate({ token }, { isRevoked: true });
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    revokeRefreshToken,
    verifyRefreshToken
};
