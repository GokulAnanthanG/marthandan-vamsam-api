const SpecialAccessPermission = require('../models/SpecialAccessPermission.model');
const FamilyMember = require('../models/FamilyMember.model');
const ApiError = require('../utils/apiError');

class SpecialAccessPermissionService {
    async requestAccess(userId, targetMemberId, treeId, allowedFields) {
        // Check if a request already exists
        let existing = await SpecialAccessPermission.findOne({
            requestingUserId: userId,
            targetMemberId,
            status: { $in: ['PENDING', 'APPROVED'] }
        });

        if (existing) {
            if (existing.status === 'APPROVED') {
                throw new ApiError(400, 'You already have access to this profile');
            }
            throw new ApiError(400, 'A request is already pending');
        }

        const permission = new SpecialAccessPermission({
            requestingUserId: userId,
            targetMemberId,
            treeId,
            allowedFields: allowedFields || ['phone', 'email', 'maritalStatus', 'occupationType', 'companyName', 'businessName', 'schoolName', 'collegeName'],
            status: 'PENDING'
        });

        await permission.save();
        return permission;
    }

    async getPermissions(filter = {}) {
        return await SpecialAccessPermission.find(filter)
            .populate('requestingUserId', 'fullName')
            .populate('targetMemberId', 'name')
            .sort({ createdAt: -1 });
    }

    async approveAccess(permissionId, adminUserId) {
        const permission = await SpecialAccessPermission.findById(permissionId);
        if (!permission) throw new ApiError(404, 'Permission request not found');

        permission.status = 'APPROVED';
        permission.approvedBy = adminUserId;
        await permission.save();

        return permission;
    }

    async rejectAccess(permissionId, adminUserId) {
        const permission = await SpecialAccessPermission.findById(permissionId);
        if (!permission) throw new ApiError(404, 'Permission request not found');

        permission.status = 'REJECTED';
        permission.approvedBy = adminUserId;
        await permission.save();

        return permission;
    }

    async revokeAccess(permissionId, adminUserId) {
        const permission = await SpecialAccessPermission.findById(permissionId);
        if (!permission) throw new ApiError(404, 'Permission request not found');

        permission.status = 'REVOKED';
        permission.approvedBy = adminUserId;
        await permission.save();

        return permission;
    }

    async hasAccess(userId, targetMemberId) {
        const permission = await SpecialAccessPermission.findOne({
            requestingUserId: userId,
            targetMemberId,
            status: 'APPROVED'
        });
        return !!permission;
    }
}

module.exports = new SpecialAccessPermissionService();
