const AuditLog = require('../models/AuditLog.model');

class AuditLogService {
    static async logAction(userId, action, entityType, entityId, oldData = null, newData = null, session = null) {
        try {
            const logEntry = new AuditLog({
                userId,
                action,
                entityType,
                entityId,
                oldData,
                newData
            });

            if (session) {
                await logEntry.save({});
            } else {
                await logEntry.save();
            }
            return logEntry;
        } catch (error) {
            // Non-blocking log, just output to console if it fails
            console.error('Failed to write audit log:', error);
        }
    }

    static async getLogsForEntity(entityType, entityId) {
        return await AuditLog.find({ entityType, entityId }).sort({ createdAt: -1 }).populate('userId', 'fullName email');
    }
}

module.exports = AuditLogService;
