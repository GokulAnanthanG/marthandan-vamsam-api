const authService = require('../services/auth.service');
const otpService = require('../services/otp.service');
const tokenService = require('../services/token.service');
const { successResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

const sendOtp = async (req, res, next) => {
    try {
        const { mobileNumber } = req.body;
        const otp = otpService.generateOTP();
        await otpService.sendOTP(mobileNumber, otp);
        
        return successResponse(res, 200, 'OTP sent successfully');
    } catch (error) {
        next(error);
    }
};

const register = async (req, res, next) => {
    try {
        const { otp, ...userData } = req.body;

        // Verify OTP
        const isOtpValid = otpService.verifyOTP(otp);
        if (!isOtpValid) {
            throw new ApiError(400, 'Invalid OTP');
        }

        const newUser = await authService.registerUser(userData);
        
        // Generate tokens
        const accessToken = tokenService.generateAccessToken(newUser);
        const refreshToken = await tokenService.generateRefreshToken(newUser);

        return successResponse(res, 201, 'User registered successfully', {
            user: { id: newUser._id, fullName: newUser.fullName, role: newUser.role },
            accessToken,
            refreshToken
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { mobileNumber, otp } = req.body;

        // Verify OTP
        const isOtpValid = otpService.verifyOTP(otp);
        if (!isOtpValid) {
            throw new ApiError(400, 'Invalid OTP');
        }

        // Authenticate user
        const user = await authService.getUserByMobile(mobileNumber);
        if (!user) {
            throw new ApiError(404, 'Unregistered mobile number');
        }
        
        if (user.status === 'BLOCKED') {
            throw new ApiError(403, 'Your account is blocked');
        }

        // Generate tokens
        const accessToken = tokenService.generateAccessToken(user);
        const refreshToken = await tokenService.generateRefreshToken(user);

        return successResponse(res, 200, 'Login successful', {
            user: { id: user._id, fullName: user.fullName, role: user.role },
            accessToken,
            refreshToken
        });
    } catch (error) {
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) throw new ApiError(400, 'Refresh token is required');

        // Verify JWT signature
        const decoded = tokenService.verifyRefreshToken(token);

        // Check DB for revocation (requires token string lookup)
        const RefreshTokenModel = require('../models/RefreshToken.model');
        const tokenRecord = await RefreshTokenModel.findOne({ token });
        
        if (!tokenRecord || tokenRecord.isRevoked) {
            throw new ApiError(401, 'Refresh token is invalid or revoked');
        }

        const User = require('../models/User.model');
        const user = await User.findById(decoded.id);
        
        if (!user || user.status === 'BLOCKED') {
            throw new ApiError(401, 'User not found or blocked');
        }

        // Rotate token
        await tokenService.revokeRefreshToken(token);
        const newAccessToken = tokenService.generateAccessToken(user);
        const newRefreshToken = await tokenService.generateRefreshToken(user);

        return successResponse(res, 200, 'Token refreshed successfully', {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const { token } = req.body; // refresh token
        if (token) {
            await tokenService.revokeRefreshToken(token);
        }
        return successResponse(res, 200, 'Logged out successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendOtp,
    register,
    login,
    refreshToken,
    logout
};
