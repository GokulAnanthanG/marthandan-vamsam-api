const s3Service = require('../services/s3.service');
const { successResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

const uploadProfilePhoto = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new ApiError(400, 'No file uploaded');
        }

        const uploadResult = await s3Service.uploadProfilePhoto(req.file);
        
        return successResponse(res, 200, 'File uploaded successfully', {
            url: uploadResult.url,
            key: uploadResult.key
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadProfilePhoto
};
