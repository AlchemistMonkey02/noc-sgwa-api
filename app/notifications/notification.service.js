const Notification = require('./notification.model');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class NotificationService {
    /**
     * Send notification via all channels and save to DB
     */
    async send(userId, event, data) {
        try {
            const User = require('../auth/user.model');
            const emailService = require('../utils/email.service');
            const smsService = require('./sms.service');
            const whatsappService = require('./whatsapp.service');

            // 1. Get User
            let user;
            if (typeof userId === 'object' && userId.constructor.name !== 'ObjectId') {
                user = userId;
            } else {
                user = await User.findById(userId);
            }

            if (!user) {
                logger.error(`Notification failed: User ${userId} not found`);
                return;
            }

            // 2. Create In-App Notification
            // We map the system 'event' to the 'type' and 'message' fields expected by the model
            const notificationData = {
                type: this.getNotificationType(event),
                title: this.getNotificationTitle(event),
                message: this.getNotificationMessage(event, data),
                metadata: data
            };

            await this.createNotification(userId, notificationData);

            // Dispatch to all channels in parallel
            const results = await Promise.allSettled([
                emailService.sendNotification(event, user, data).then(res => ({ channel: 'email', ...res })),
                smsService.sendNotification({ event, user, ...data }).then(res => ({ channel: 'sms', ...res })),
                whatsappService.sendNotification({ event, user, ...data }).then(res => ({ channel: 'whatsapp', ...res }))
            ]);

            results.forEach(result => {
                if (result.status === 'rejected') {
                    logger.error(`Notification failed`, result.reason);
                } else if (!result.value.success) {
                    logger.warn(`Notification channel failed`, result.value);
                }
            });

            return { success: true };

        } catch (error) {
            logger.error('Error in notification dispatch', error);
            // Don't throw, notifications shouldn't break the main flow
            return { success: false, error: error.message };
        }
    }

    getNotificationTitle(event) {
        return event.replace(/_/g, ' '); // Simple formatting
    }

    getNotificationType(event) {
        const allowedTypes = [
            'APPLICATION_SUBMITTED', 'STATUS_UPDATE', 'QUERY_RAISED', 'QUERY_RESPONDED',
            'INSPECTION_SCHEDULED', 'PAYMENT_RECEIVED', 'NOC_ISSUED', 'NOC_EXPIRING',
            'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED', 'USER_REGISTERED', 'LOGIN', 'SYSTEM', 'PASSWORD_RESET'
        ];
        return allowedTypes.includes(event) ? event : 'SYSTEM';
    }

    getNotificationMessage(event, data) {
        // Reuse format logic from SMS/WhatsApp or have a centralized one
        const smsService = require('./sms.service');
        return smsService.formatMessage(event, data);
    }

    /**
     * Create a new notification for a user (DB only)
     */
    async createNotification(userId, data) {
        try {
            const notification = new Notification({
                notificationId: uuidv4(),
                userId,
                ...data
            });
            await notification.save();
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
