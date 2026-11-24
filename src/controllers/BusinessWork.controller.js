const businessWorkService = require('../services/BusinessWork.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class BusinessWorkController {
    async getBusinessList(req, res) {
        try {
            const businessType = req.query.businessType || null;
            const relationFilter = req.query.relationFilter || 'ALL';
            const search = req.query.search || '';

            const list = await businessWorkService.getBusinessList({
                userId: req.user.id,
                userRole: req.user.role,
                businessType,
                relationFilter,
                search
            });
            return successResponse(res, 200, 'Business directory fetched', list);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getWorkList(req, res) {
        try {
            const fieldOfWork = req.query.fieldOfWork || null;
            const relationFilter = req.query.relationFilter || 'ALL';
            const search = req.query.search || '';

            const list = await businessWorkService.getWorkList({
                userId: req.user.id,
                userRole: req.user.role,
                fieldOfWork,
                relationFilter,
                search
            });
            return successResponse(res, 200, 'Work directory fetched', list);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getRelativesDirectory(req, res) {
        try {
            const search = req.query.search || '';
            const list = await businessWorkService.getRelativesDirectory({
                userId: req.user.id,
                userRole: req.user.role,
                search
            });
            return successResponse(res, 200, 'Relatives directory fetched', list);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getEmployees(req, res) {
        try {
            const { ownerId } = req.params;
            const result = await businessWorkService.getEmployees({
                userId: req.user.id,
                userRole: req.user.role,
                businessOwnerId: ownerId
            });
            return successResponse(res, 200, 'Employees fetched', result);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }
}

module.exports = new BusinessWorkController();
