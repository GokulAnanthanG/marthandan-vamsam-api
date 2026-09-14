const SpecialAccessPermissionService = require('../services/SpecialAccessPermission.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class SpecialAccessPermissionController {
    async requestAccess(req, res) {
        try {
            const { targetMemberId, treeId, allowedFields } = req.body;
            const permission = await SpecialAccessPermissionService.requestAccess(
                req.user._id,
                targetMemberId,
                treeId,
                allowedFields
            );
            return successResponse(res, 201, 'Access request submitted successfully', permission);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getPermissions(req, res) {
        try {
            const filter = {};
            if (req.user.role === 'NORMAL_USER') {
                filter.requestingUserId = req.user._id;
            }
            const permissions = await SpecialAccessPermissionService.getPermissions(filter);
            return successResponse(res, 200, 'Permissions fetched successfully', permissions);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async approveAccess(req, res) {
        try {
            const permission = await SpecialAccessPermissionService.approveAccess(req.params.permissionId, req.user._id);
            return successResponse(res, 200, 'Access request approved', permission);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async rejectAccess(req, res) {
        try {
            const permission = await SpecialAccessPermissionService.rejectAccess(req.params.permissionId, req.user._id);
            return successResponse(res, 200, 'Access request rejected', permission);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async revokeAccess(req, res) {
        try {
            const permission = await SpecialAccessPermissionService.revokeAccess(req.params.permissionId, req.user._id);
            return successResponse(res, 200, 'Access revoked', permission);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }
}

module.exports = new SpecialAccessPermissionController();
