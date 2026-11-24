const matrimonialService = require('../services/Matrimonial.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class MatrimonialController {
    async getProfiles(req, res) {
        try {
            const gender = req.query.gender || null;
            const search = req.query.search || '';

            const list = await matrimonialService.getProfiles({
                userId: req.user.id,
                userRole: req.user.role,
                gender,
                search
            });
            return successResponse(res, 200, 'Matrimonial profiles fetched', list);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getProfileDetail(req, res) {
        try {
            const { id } = req.params;
            const profile = await matrimonialService.getProfileDetail({
                profileId: id,
                userId: req.user.id,
                userRole: req.user.role
            });
            return successResponse(res, 200, 'Profile details fetched', profile);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async updateAssets(req, res) {
        try {
            const { id } = req.params;
            const updated = await matrimonialService.updateProfileAssets({
                profileId: id,
                userId: req.user.id,
                userRole: req.user.role,
                assets: req.body
            });
            return successResponse(res, 200, 'Matrimonial assets updated successfully', updated);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }
}

module.exports = new MatrimonialController();
