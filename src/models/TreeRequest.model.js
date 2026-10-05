const mongoose = require('mongoose');

const treeRequestSchema = new mongoose.Schema({
    requestType: {
        type: String,
        enum: ['ADD_CHILD', 'EDIT_NODE'],
        required: true
    },
    targetNodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyMember',
        required: true
    },
    requesterName: {
        type: String,
        required: true,
        trim: true
    },
    requesterFatherName: {
        type: String,
        trim: true,
        default: null
    },
    requesterPhone: {
        type: String,
        required: true,
        trim: true
    },
    requestReason: {
        type: String,
        required: true,
        trim: true
    },
    requestedPayload: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TreeRequest', treeRequestSchema);
