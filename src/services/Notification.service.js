const Notification = require('../models/Notification.model');

class NotificationService {
    /**
     * Common notification dispatcher across House, Work Address, Employees, Varan, and Business
     */
    async sendNotification({ sender = null, receiver, type, category, title, message, rejectionReason = null, referenceId = null }) {
        if (!receiver) return null;
        try {
            const notification = new Notification({
                sender,
                receiver,
                type,
                category,
                title,
                message,
                rejectionReason,
                referenceId
            });
            await notification.save();
            return notification;
        } catch (err) {
            console.error('Failed to dispatch notification:', err);
            return null;
        }
    }

    async getUserNotifications(userId, { unreadOnly = false, page = 1, limit = 20 } = {}) {
        const query = { receiver: userId };
        if (unreadOnly) {
            query.isRead = false;
        }

        const skip = (page - 1) * limit;
        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .populate('sender', 'fullName profilePhotoUrl mobileNumber')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(query),
            Notification.countDocuments({ receiver: userId, isRead: false })
        ]);

        return {
            notifications,
            total,
            unreadCount,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async markAsRead(notificationId, userId) {
        return await Notification.findOneAndUpdate(
            { _id: notificationId, receiver: userId },
            { isRead: true },
            { new: true }
        );
    }

    async markAllAsRead(userId) {
        return await Notification.updateMany(
            { receiver: userId, isRead: false },
            { isRead: true }
        );
    }

    async getUnreadCount(userId) {
        return await Notification.countDocuments({ receiver: userId, isRead: false });
    }
}

module.exports = new NotificationService();
