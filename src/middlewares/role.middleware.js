const { errorResponse } = require('../utils/apiResponse');

const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return errorResponse(res, 403, 'Forbidden. You do not have permission to perform this action.');
        }
        next();
    };
};

module.exports = roleMiddleware;
