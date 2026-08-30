const { errorResponse } = require('../utils/apiResponse');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errors = error.details.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));
        return errorResponse(res, 400, 'Validation Error', errors);
    }
    
    next();
};

module.exports = validate;
