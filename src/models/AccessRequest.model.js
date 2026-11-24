const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema({
    requestType: {
        type: String,
        enum: ['HOUSE', 'WORK_ADDRESS', 'EMPLOYEES', 'VARAN', 'BUSINESS'],
        required: true,
        index: true
    },
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Target owner user (for business, work, employee requests)
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    // Target family member (if tied to a specific tree member)
    targetMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyMember',
        default: null
    },
    // For Varan (matrimonial profile) requests
    targetVaranId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MatrimonialProfile',
        default: null
    },
    // Reason provided by requester (Mandatory for Varan, optional for others)
    reason: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
        index: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Rejection reason (Mandatory if rejected as per Requirement 6)
    rejectionReason: {
        type: String,
        trim: true,
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AccessRequest', accessRequestSchema);
