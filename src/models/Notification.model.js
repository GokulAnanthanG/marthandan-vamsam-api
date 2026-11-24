const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'ACCESS_REQUEST_SUBMITTED',
            'ACCESS_REQUEST_APPROVED',
            'ACCESS_REQUEST_REJECTED',
            'ACCESS_GRANTED',
            'EVENT_CREATED',
            'GENERAL'
        ],
        required: true
    },
    category: {
        type: String,
        enum: ['HOUSE', 'WORK_ADDRESS', 'EMPLOYEES', 'VARAN', 'BUSINESS', 'EVENT', 'GENERAL'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    rejectionReason: {
        type: String,
        trim: true,
        default: null
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
