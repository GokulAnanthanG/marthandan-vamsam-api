const accessRequestService = require('../services/AccessRequest.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class AccessRequestController {
    async createRequest(req, res) {
        try {
            const { requestType, targetUserId, targetMemberId, targetVaranId, reason } = req.body;
            const result = await accessRequestService.createRequest({
                requesterId: req.user.id,
                requestType,
                targetUserId,
                targetMemberId,
                targetVaranId,
                reason
            });
            return successResponse(res, 201, 'Access request processed', result);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getRequestsByTab(req, res) {
        try {
            const tab = req.query.tab || 'ALL';
            const status = req.query.status || null;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await accessRequestService.getRequestsByTab({
                tab,
                userId: req.user.id,
                role: req.user.role,
                status,
                page,
                limit
            });
            return successResponse(res, 200, 'Access requests fetched successfully', result);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async approveRequest(req, res) {
        try {
            const { id } = req.params;
            const updated = await accessRequestService.approveRequest(id, req.user.id, req.user.role);
            return successResponse(res, 200, 'Access request approved successfully', updated);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async rejectRequest(req, res) {
        try {
            const { id } = req.params;
            const { rejectionReason } = req.body;
            const updated = await accessRequestService.rejectRequest(id, req.user.id, req.user.role, rejectionReason);
            return successResponse(res, 200, 'Access request rejected', updated);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getMySentRequests(req, res) {
        try {
            const list = await accessRequestService.getMySentRequests(req.user.id);
            return successResponse(res, 200, 'My sent access requests', list);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }
}

module.exports = new AccessRequestController();
