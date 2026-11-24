const notificationService = require('../services/Notification.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class NotificationController {
    async getNotifications(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const unreadOnly = req.query.unreadOnly === 'true';

            const result = await notificationService.getUserNotifications(req.user.id, {
                unreadOnly,
                page,
                limit
            });
            return successResponse(res, 200, 'Notifications fetched successfully', result);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getUnreadCount(req, res) {
        try {
            const count = await notificationService.getUnreadCount(req.user.id);
            return successResponse(res, 200, 'Unread notification count', { unreadCount: count });
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const notification = await notificationService.markAsRead(id, req.user.id);
            return successResponse(res, 200, 'Notification marked as read', notification);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async markAllAsRead(req, res) {
        try {
            await notificationService.markAllAsRead(req.user.id);
            return successResponse(res, 200, 'All notifications marked as read');
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }
}

module.exports = new NotificationController();
