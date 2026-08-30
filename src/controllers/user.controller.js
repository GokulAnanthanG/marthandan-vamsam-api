const User = require('../models/User.model');
const { successResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        if (!user) {
            throw new ApiError(404, 'User not found');
        }
        return successResponse(res, 200, 'Profile retrieved successfully', { user });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile
};
