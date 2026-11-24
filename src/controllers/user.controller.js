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

const updateProfile = async (req, res, next) => {
    try {
        const allowedUpdates = [
            'fullName',
            'fatherName',
            'residentialAddress',
            'whatsappNumber',
            'profileType',
            'businessName',
            'businessType',
            'businessAddress',
            'occupation',
            'fieldOfWork',
            'companyName',
            'jobTitle',
            'workAddress'
        ];

        const updates = {};
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true }
        ).select('-passwordHash');

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        return successResponse(res, 200, 'Profile updated successfully', { user });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile
};
