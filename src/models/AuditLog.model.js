const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    entityType: {
        type: String,
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    oldData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    newData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true,
    updatedAt: false // Audit logs shouldn't be updated
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
