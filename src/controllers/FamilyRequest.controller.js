const FamilyRequestService = require('../services/FamilyRequest.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class FamilyRequestController {
    async createRequest(req, res) {
        try {
            const { treeId, targetMemberId, requestType, payloadJson } = req.body;
            const request = await FamilyRequestService.createRequest(
                req.user._id,
                treeId,
                targetMemberId,
                requestType,
                payloadJson
            );
            return successResponse(res, 201, 'Request submitted successfully', request);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getRequests(req, res) {
        try {
            const filter = {}; // Expand with req.query later
            // If user is NORMAL_USER, they should only see their own requests
            if (req.user.role === 'NORMAL_USER') {
                filter.requesterUserId = req.user._id;
            }
            const requests = await FamilyRequestService.getRequests(filter);
            return successResponse(res, 200, 'Requests fetched successfully', requests);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getRequestById(req, res) {
        try {
            const request = await FamilyRequestService.getRequestById(req.params.requestId);
            return successResponse(res, 200, 'Request fetched successfully', request);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async approveRequest(req, res) {
        try {
            const request = await FamilyRequestService.approveRequest(req.params.requestId, req.user._id);
            return successResponse(res, 200, 'Request approved successfully', request);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async rejectRequest(req, res) {
        try {
            const { reviewComment } = req.body;
            const request = await FamilyRequestService.rejectRequest(req.params.requestId, req.user._id, reviewComment);
            return successResponse(res, 200, 'Request rejected', request);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async requestChanges(req, res) {
        try {
            const { reviewComment } = req.body;
            const request = await FamilyRequestService.requestChanges(req.params.requestId, req.user._id, reviewComment);
            return successResponse(res, 200, 'Changes requested', request);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }
}

module.exports = new FamilyRequestController();
