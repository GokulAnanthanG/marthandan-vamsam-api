const { errorResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

const errorMiddleware = (err, req, res, next) => {
    console.error('Error:', err);

    if (err instanceof ApiError) {
        return errorResponse(res, err.statusCode, err.message);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        return errorResponse(res, 400, 'Duplicate value entered', err.keyValue);
    }

    // Multer size limit error
    if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
        return errorResponse(res, 400, 'File is too large. Limit is 5MB.');
    }

    return errorResponse(res, 500, 'Internal Server Error');
};

module.exports = errorMiddleware;
