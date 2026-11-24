const AccessRequest = require('../models/AccessRequest.model');
const User = require('../models/User.model');
const FamilyMember = require('../models/FamilyMember.model');
const notificationService = require('./Notification.service');
const ApiError = require('../utils/apiError');

class AccessRequestService {
    /**
     * Submit an access request across House, Work Address, Employees, Varan, or Business
     */
    async createRequest({ requesterId, requestType, targetUserId = null, targetMemberId = null, targetVaranId = null, reason = '' }) {
        if (!['HOUSE', 'WORK_ADDRESS', 'EMPLOYEES', 'VARAN', 'BUSINESS'].includes(requestType)) {
            throw new ApiError(400, 'Invalid request type');
        }

        // Varan requests require a stated reason (Requirement 5.4)
        if (requestType === 'VARAN' && (!reason || !reason.trim())) {
            throw new ApiError(400, 'Please state the reason for requesting matrimonial access');
        }

        // Check if there is already an approved or pending request
        const query = {
            requesterId,
            requestType,
            status: { $in: ['PENDING', 'APPROVED'] }
        };

        if (targetUserId) query.targetUserId = targetUserId;
        if (targetMemberId) query.targetMemberId = targetMemberId;
        if (targetVaranId) query.targetVaranId = targetVaranId;

        const existing = await AccessRequest.findOne(query);
        if (existing) {
            if (existing.status === 'APPROVED') {
                return { request: existing, alreadyApproved: true };
            }
            throw new ApiError(400, 'An access request is already pending review');
        }

        const request = new AccessRequest({
            requestType,
            requesterId,
            targetUserId,
            targetMemberId,
            targetVaranId,
            reason: reason.trim(),
            status: 'PENDING'
        });
        await request.save();

        // Centralized Notification Module Scenario 1: Access Request Submitted
        const requester = await User.findById(requesterId).select('fullName');
        const requesterName = requester ? requester.fullName : 'A community member';

        let categoryLabel = 'House Directory';
        if (requestType === 'WORK_ADDRESS') categoryLabel = 'Work Address';
        else if (requestType === 'EMPLOYEES') categoryLabel = 'Employee Details';
        else if (requestType === 'VARAN') categoryLabel = 'Matrimonial Profile';
        else if (requestType === 'BUSINESS') categoryLabel = 'Business Details';

        // Notify specific owner if targeted; else notify Admins
        if (targetUserId) {
            await notificationService.sendNotification({
                sender: requesterId,
                receiver: targetUserId,
                type: 'ACCESS_REQUEST_SUBMITTED',
                category: requestType,
                title: `New ${categoryLabel} Access Request`,
                message: `${requesterName} has requested permission to view your ${categoryLabel.toLowerCase()}.`,
                referenceId: request._id
            });
        }

        // Also notify admins so centralized management has visibility
        const admins = await User.find({ role: { $in: ['ADMIN', 'SUB_ADMIN'] } }).select('_id');
        for (const admin of admins) {
            if (String(admin._id) !== String(targetUserId) && String(admin._id) !== String(requesterId)) {
                await notificationService.sendNotification({
                    sender: requesterId,
                    receiver: admin._id,
                    type: 'ACCESS_REQUEST_SUBMITTED',
                    category: requestType,
                    title: `Access Request: ${categoryLabel}`,
                    message: `${requesterName} requested access to ${categoryLabel.toLowerCase()}.`,
                    referenceId: request._id
                });
            }
        }

        return { request, alreadyApproved: false };
    }

    /**
     * Get requests filtered by tab for the Centralized Access Request Management Screen
     * Tabs: HOUSE, WORK_ADDRESS, EMPLOYEES, VARAN, BUSINESS
     */
    async getRequestsByTab({ tab, userId, role, status = null, page = 1, limit = 20 }) {
        const query = {};
        if (tab && tab !== 'ALL') {
            query.requestType = tab;
        }

        if (status) {
            query.status = status;
        }

        // If normal user, they see incoming requests targeting their own profile
        const isAdmin = ['ADMIN', 'SUB_ADMIN'].includes(String(role || '').toUpperCase());
        if (!isAdmin) {
            query.targetUserId = userId;
        }

        const skip = (page - 1) * limit;
        const [requests, total] = await Promise.all([
            AccessRequest.find(query)
                .populate('requesterId', 'fullName mobileNumber profilePhotoUrl occupation residentialAddress')
                .populate('targetUserId', 'fullName businessName businessAddress companyName mobileNumber')
                .populate('targetMemberId', 'name businessName residentialAddress phone')
                .populate('targetVaranId', 'personName gender age education occupation')
                .populate('approvedBy', 'fullName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AccessRequest.countDocuments(query)
        ]);

        return {
            requests,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Approve an access request (Scenario 2: Request Approved & Access Granted)
     */
    async approveRequest(requestId, reviewerId, reviewerRole) {
        const request = await AccessRequest.findById(requestId);
        if (!request) throw new ApiError(404, 'Access request not found');

        // Verify permission: Must be Admin/SubAdmin or the targeted owner
        const isOwner = request.targetUserId && String(request.targetUserId) === String(reviewerId);
        const isAdmin = ['ADMIN', 'SUB_ADMIN'].includes(String(reviewerRole || '').toUpperCase());

        if (!isOwner && !isAdmin) {
            throw new ApiError(403, 'You are not authorized to approve this request');
        }

        request.status = 'APPROVED';
        request.approvedBy = reviewerId;
        request.rejectionReason = null;
        request.reviewedAt = new Date();
        await request.save();

        let categoryLabel = 'House Directory';
        if (request.requestType === 'WORK_ADDRESS') categoryLabel = 'Work Address';
        else if (request.requestType === 'EMPLOYEES') categoryLabel = 'Employee Details';
        else if (request.requestType === 'VARAN') categoryLabel = 'Matrimonial Profile';
        else if (request.requestType === 'BUSINESS') categoryLabel = 'Business Details';

        // Notify requesting user
        await notificationService.sendNotification({
            sender: reviewerId,
            receiver: request.requesterId,
            type: 'ACCESS_REQUEST_APPROVED',
            category: request.requestType,
            title: `Access Approved: ${categoryLabel}`,
            message: `Your request to view ${categoryLabel.toLowerCase()} has been approved. You now have full access.`,
            referenceId: request._id
        });

        return request;
    }

    /**
     * Reject an access request (Scenario 3: Request Rejected with mandatory reason)
     */
    async rejectRequest(requestId, reviewerId, reviewerRole, rejectionReason) {
        if (!rejectionReason || !rejectionReason.trim()) {
            throw new ApiError(400, 'Rejection reason is required');
        }

        const request = await AccessRequest.findById(requestId);
        if (!request) throw new ApiError(404, 'Access request not found');

        const isOwner = request.targetUserId && String(request.targetUserId) === String(reviewerId);
        const isAdmin = ['ADMIN', 'SUB_ADMIN'].includes(String(reviewerRole || '').toUpperCase());

        if (!isOwner && !isAdmin) {
            throw new ApiError(403, 'You are not authorized to reject this request');
        }

        request.status = 'REJECTED';
        request.approvedBy = reviewerId;
        request.rejectionReason = rejectionReason.trim();
        request.reviewedAt = new Date();
        await request.save();

        let categoryLabel = 'House Directory';
        if (request.requestType === 'WORK_ADDRESS') categoryLabel = 'Work Address';
        else if (request.requestType === 'EMPLOYEES') categoryLabel = 'Employee Details';
        else if (request.requestType === 'VARAN') categoryLabel = 'Matrimonial Profile';
        else if (request.requestType === 'BUSINESS') categoryLabel = 'Business Details';

        // Notify requesting user along with rejection reason
        await notificationService.sendNotification({
            sender: reviewerId,
            receiver: request.requesterId,
            type: 'ACCESS_REQUEST_REJECTED',
            category: request.requestType,
            title: `Access Request Rejected: ${categoryLabel}`,
            message: `Your request to view ${categoryLabel.toLowerCase()} was not approved. Reason: ${rejectionReason.trim()}`,
            rejectionReason: rejectionReason.trim(),
            referenceId: request._id
        });

        return request;
    }

    /**
     * Check if a user has approved access
     */
    async hasAccess({ requesterId, requestType, targetUserId = null, targetMemberId = null, targetVaranId = null }) {
        const query = {
            requesterId,
            requestType,
            status: 'APPROVED'
        };

        if (targetUserId) query.targetUserId = targetUserId;
        if (targetMemberId) query.targetMemberId = targetMemberId;
        if (targetVaranId) query.targetVaranId = targetVaranId;

        const record = await AccessRequest.findOne(query);
        return !!record;
    }

    /**
     * Get user's own sent requests
     */
    async getMySentRequests(userId) {
        return await AccessRequest.find({ requesterId: userId })
            .populate('targetUserId', 'fullName businessName')
            .populate('targetMemberId', 'name')
            .sort({ createdAt: -1 })
            .lean();
    }
}

module.exports = new AccessRequestService();
