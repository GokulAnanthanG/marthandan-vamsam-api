const mongoose = require('mongoose');

const specialAccessPermissionSchema = new mongoose.Schema({
    requestingUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyMember',
        required: true
    },
    treeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyTree',
        required: true
    },
    allowedFields: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'],
        default: 'PENDING'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SpecialAccessPermission', specialAccessPermissionSchema);
