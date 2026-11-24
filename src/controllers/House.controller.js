const houseService = require('../services/House.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class HouseController {
    async getHouses(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10; // Requirement 3: 10 per page
            const search = req.query.search || '';

            const result = await houseService.getHouses({
                userId: req.user.id,
                userRole: req.user.role,
                search,
                page,
                limit
            });

            return successResponse(res, 200, 'Houses fetched successfully', result);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async checkAccess(req, res) {
        try {
            const result = await houseService.checkHouseAccess(req.user.id, req.user.role);
            return successResponse(res, 200, 'House access status', result);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }
}

module.exports = new HouseController();
