const { errorResponse } = require('../utils/apiResponse');

const roleMiddleware = (...allowedRoles) => {
    const roles = allowedRoles.flat();
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return errorResponse(res, 403, 'Forbidden. You do not have permission to perform this action.');
        }
        next();
    };
};

module.exports = roleMiddleware;
