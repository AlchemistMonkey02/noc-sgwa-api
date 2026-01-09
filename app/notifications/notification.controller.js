const notificationService = require('./notification.service');
const logger = require('../utils/logger');

class NotificationController {
    /**
     * GET /api/notifications - Get user notifications
     */
    async getNotifications(req, res, next) {
        try {
            const { isRead, type, priority, limit } = req.query;

            const filters = {
                isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
                type,
                priority,
                limit: parseInt(limit) || 50
            };

            const notifications = await notificationService.getUserNotifications(
                req.user.id,
                filters
            );

            res.status(200).json({
                success: true,
                count: notifications.length,
                data: notifications
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/notifications/unread-count - Get unread notification count
     */
    async getUnreadCount(req, res, next) {
        try {
            const count = await notificationService.getUnreadCount(req.user.id);

            res.status(200).json({
                success: true,
                data: { unreadCount: count }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/notifications/:id/read - Mark notification as read
     */
    async markAsRead(req, res, next) {
        try {
            const { id } = req.params;

            const notification = await notificationService.markAsRead(id, req.user.id);

            res.status(200).json({
                success: true,
                data: notification,
                message: 'Notification marked as read'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/notifications/mark-all-read - Mark all notifications as read
     */
    async markAllAsRead(req, res, next) {
        try {
            const result = await notificationService.markAllAsRead(req.user.id);

            res.status(200).json({
                success: true,
                data: { modifiedCount: result.modifiedCount },
                message: `${result.modifiedCount} notification(s) marked as read`
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/notifications/:id - Delete notification
     */
    async deleteNotification(req, res, next) {
        try {
            const { id } = req.params;

            const result = await notificationService.deleteNotification(id, req.user.id);

            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NotificationController();
