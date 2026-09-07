const mongoose = require('mongoose');

const familyDataRequestSchema = new mongoose.Schema({
    requesterUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    treeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyTree',
        required: true
    },
    targetMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyMember',
        default: null
    },
    requestType: {
        type: String,
        enum: ['MODIFICATION_REQUEST', 'ADD_SUBTREE_REQUEST', 'FAMILY_DATA_REQUEST', 'HEAD_FAMILY_DETAILS_REQUEST', 'SPECIAL_ACCESS_REQUEST'],
        required: true
    },
    payloadJson: {
        type: mongoose.Schema.Types.Mixed, // flexible json
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'],
        default: 'PENDING'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewComment: {
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

module.exports = mongoose.model('FamilyDataRequest', familyDataRequestSchema);
