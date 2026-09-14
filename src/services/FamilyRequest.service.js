const FamilyDataRequest = require('../models/FamilyDataRequest.model');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');
const FamilyMemberService = require('./FamilyMember.service');

class FamilyRequestService {
    async createRequest(userId, treeId, targetMemberId, requestType, payloadJson) {
        const request = new FamilyDataRequest({
            requesterUserId: userId,
            treeId,
            targetMemberId,
            requestType,
            payloadJson,
            status: 'PENDING'
        });
        await request.save();
        return request;
    }

    async getRequests(filter = {}) {
        return await FamilyDataRequest.find(filter)
            .populate('requesterUserId', 'fullName mobileNumber')
            .populate('targetMemberId', 'name gender')
            .sort({ createdAt: -1 });
    }

    async getRequestById(requestId) {
        const request = await FamilyDataRequest.findById(requestId)
            .populate('requesterUserId', 'fullName mobileNumber')
            .populate('targetMemberId', 'name gender');
        if (!request) throw new ApiError(404, 'Request not found');
        return request;
    }

    async approveRequest(requestId, reviewerId) {
        // const session = await mongoose.startSession();
        // session.startTransaction();
        try {
            const request = await FamilyDataRequest.findById(requestId);
            if (!request) throw new ApiError(404, 'Request not found');
            if (request.status !== 'PENDING' && request.status !== 'UNDER_REVIEW') {
                throw new ApiError(400, 'Only pending requests can be approved');
            }

            // Apply changes based on request type
            if (request.requestType === 'MODIFICATION_REQUEST') {
                if (!request.targetMemberId) throw new ApiError(400, 'Target member missing');
                await FamilyMemberService.updateMember(request.targetMemberId, request.payloadJson, session);
            } else if (request.requestType === 'ADD_SUBTREE_REQUEST') {
                // Implementation for subtree addition
                // For Phase 3, we simply accept it as approved.
            }

            request.status = 'APPROVED';
            request.reviewedBy = reviewerId;
            request.reviewedAt = new Date();
            await request.save({});

            // await session.commitTransaction();
            // session.endSession();
            return request;
        } catch (error) {
            // await session.abortTransaction();
            // session.endSession();
            throw error;
        }
    }

    async rejectRequest(requestId, adminUserId, reviewComment) {
        const request = await FamilyDataRequest.findById(requestId);
        if (!request) throw new ApiError(404, 'Request not found');

        request.status = 'REJECTED';
        request.reviewedBy = adminUserId;
        request.reviewedAt = new Date();
        request.reviewComment = reviewComment;

        await request.save();
        return request;
    }

    async requestChanges(requestId, adminUserId, reviewComment) {
        const request = await FamilyDataRequest.findById(requestId);
        if (!request) throw new ApiError(404, 'Request not found');

        request.status = 'CHANGES_REQUESTED';
        request.reviewComment = reviewComment;
        request.reviewedAt = new Date();
        
        await request.save();
        return request;
    }
}

module.exports = new FamilyRequestService();
