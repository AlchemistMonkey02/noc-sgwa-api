const Notification = require('./notification.model');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class NotificationService {
    /**
     * Create a new notification for a user
     */
    async createNotification(userId, data) {
        try {
            const notification = new Notification({
                notificationId: uuidv4(),
                userId,
                ...data
            });

            await notification.save();
            logger.info(`Notification created for user ${userId}`, { type: data.type });

            // TODO: Emit real-time event via Socket.IO when implemented
            // io.to(userId).emit('notification', notification);

            return notification;
        } catch (error) {
            logger.error('Error creating notification', error);
            throw error;
        }
    }

    /**
     * Get user notifications with filters
     */
    async getUserNotifications(userId, filters = {}) {
        try {
            const query = { userId };

            if (filters.isRead !== undefined) {
                query.isRead = filters.isRead;
            }

            if (filters.type) {
                query.type = filters.type;
            }

            if (filters.priority) {
                query.priority = filters.priority;
            }

            const notifications = await Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(filters.limit || 50);

            return notifications;
        } catch (error) {
            logger.error('Error fetching user notifications', error);
            throw error;
        }
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification.findOneAndUpdate(
                { notificationId, userId },
                {
                    isRead: true,
                    readAt: new Date()
                },
                { new: true }
            );

            if (!notification) {
                throw {
                    statusCode: 404,
                    code: 'NOTIFICATION_NOT_FOUND',
                    message: 'Notification not found'
                };
            }

            return notification;
        } catch (error) {
            logger.error('Error marking notification as read', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        try {
            const result = await Notification.updateMany(
                { userId, isRead: false },
                {
                    isRead: true,
                    readAt: new Date()
                }
            );

            logger.info(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);
            return result;
        } catch (error) {
            logger.error('Error marking all notifications as read', error);
            throw error;
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId) {
        try {
            return await Notification.countDocuments({ userId, isRead: false });
        } catch (error) {
            logger.error('Error getting unread count', error);
            throw error;
        }
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId, userId) {
        try {
            const result = await Notification.deleteOne({ notificationId, userId });

            if (result.deletedCount === 0) {
                throw {
                    statusCode: 404,
                    code: 'NOTIFICATION_NOT_FOUND',
                    message: 'Notification not found'
                };
            }

            logger.info(`Notification ${notificationId} deleted for user ${userId}`);
            return { message: 'Notification deleted successfully' };
        } catch (error) {
            logger.error('Error deleting notification', error);
            throw error;
        }
    }

    /**
     * Delete old notifications (cleanup)
     */
    async deleteExpiredNotifications() {
        try {
            const result = await Notification.deleteMany({
                expiresAt: { $lte: new Date() }
            });

            logger.info(`Deleted ${result.deletedCount} expired notifications`);
            return result;
        } catch (error) {
            logger.error('Error deleting expired notifications', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();
