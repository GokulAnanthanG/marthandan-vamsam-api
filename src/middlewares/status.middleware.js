const { errorResponse } = require('../utils/apiResponse');

const statusMiddleware = (req, res, next) => {
    if (req.user && req.user.status === 'BLOCKED') {
        return errorResponse(res, 403, 'Your account has been blocked.');
    }
    next();
};

module.exports = statusMiddleware;
