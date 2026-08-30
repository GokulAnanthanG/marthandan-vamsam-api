const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'Access denied. No token provided.');
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            req.user = decoded; // Attach user payload to request
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new ApiError(401, 'Token expired. Please refresh your token.');
            }
            throw new ApiError(401, 'Invalid token.');
        }
    } catch (error) {
        return errorResponse(res, error.statusCode || 500, error.message);
    }
};

module.exports = authMiddleware;
