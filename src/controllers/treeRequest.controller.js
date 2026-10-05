const TreeRequest = require('../models/TreeRequest.model');
const FamilyMember = require('../models/FamilyMember.model');
const FamilyRelationship = require('../models/FamilyRelationship.model');
const { successResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

// Guest: Submit a request to add a child or edit a node
const submitRequest = async (req, res, next) => {
    try {
        const { requestType, targetNodeId, requesterName, requesterFatherName, requesterPhone, requestReason, requestedPayload } = req.body;

        const newRequest = new TreeRequest({
            requestType,
            targetNodeId,
            requesterName,
            requesterFatherName,
            requesterPhone,
            requestReason,
            requestedPayload
        });

        await newRequest.save();

        return successResponse(res, 201, 'Request submitted successfully', newRequest);
    } catch (error) {
        next(error);
    }
};

// Admin: Get all pending requests
const getRequests = async (req, res, next) => {
    try {
        const requests = await TreeRequest.find({ status: 'PENDING' })
            .populate('targetNodeId', 'name photoUrl')
            .sort({ createdAt: -1 });
        return successResponse(res, 200, 'Requests fetched successfully', requests);
    } catch (error) {
        next(error);
    }
};

// Admin: Approve request
const approveRequest = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { requestId } = req.params;
        const treeRequest = await TreeRequest.findById(requestId).session(session);

        if (!treeRequest || treeRequest.status !== 'PENDING') {
            throw new ApiError(404, 'Pending request not found');
        }

        const targetNode = await FamilyMember.findById(treeRequest.targetNodeId).session(session);
        if (!targetNode) {
             throw new ApiError(404, 'Target node not found');
        }

        if (treeRequest.requestType === 'ADD_CHILD') {
            // Create new member
            const payload = treeRequest.requestedPayload;
            const newMember = new FamilyMember({
                ...payload,
                treeId: targetNode.treeId
            });
            await newMember.save({ session });

            // Create relationship
            const relationship = new FamilyRelationship({
                treeId: targetNode.treeId,
                parentMemberId: targetNode._id,
                childMemberId: newMember._id
            });
            await relationship.save({ session });
            
            // Auto update parent marital status if SINGLE
            if (targetNode.maritalStatus === 'SINGLE') {
                targetNode.maritalStatus = 'MARRIED';
                await targetNode.save({ session });
            }

        } else if (treeRequest.requestType === 'EDIT_NODE') {
            // Update existing member
            await FamilyMember.findByIdAndUpdate(treeRequest.targetNodeId, {
                $set: treeRequest.requestedPayload
            }, { session, new: true, runValidators: true });
        }

        // Delete request or mark as approved
        // According to prompt: "delete the request from the tree_requests collection"
        await TreeRequest.findByIdAndDelete(requestId).session(session);

        await session.commitTransaction();
        session.endSession();

        return successResponse(res, 200, 'Request approved and applied successfully');
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// Admin: Reject request
const rejectRequest = async (req, res, next) => {
    try {
        const { requestId } = req.params;
        
        // According to prompt: "simply delete the request from the tree_requests collection"
        const deletedRequest = await TreeRequest.findByIdAndDelete(requestId);
        
        if (!deletedRequest) {
            throw new ApiError(404, 'Request not found');
        }

        return successResponse(res, 200, 'Request rejected and removed successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitRequest,
    getRequests,
    approveRequest,
    rejectRequest
};
