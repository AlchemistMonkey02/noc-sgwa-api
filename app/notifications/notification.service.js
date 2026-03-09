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
            return { success: false, error: error.message };
        }
    }

    /**
     * Notify all users of a specific type (e.g., all SGWA officers)
     */
    async notifyRole(userType, event, data) {
        try {
            const User = require('../auth/user.model');
            const officers = await User.find({ userType, accountStatus: 'ACTIVE' });

            logger.info(`Sending ${event} to ${officers.length} officers of type ${userType}`);

            const promises = officers.map(officer => this.send(officer._id, event, data));
            await Promise.allSettled(promises);

            return { success: true, count: officers.length };
        } catch (error) {
            logger.error(`Error notifying role ${userType}`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Notify all DGOs of a specific district
     */
    async notifyDistrictOfficers(district, event, data) {
        try {
            const User = require('../auth/user.model');
            const query = {
                userType: 'DGO',
                accountStatus: 'ACTIVE',
                "communicationAddress.district": { $regex: new RegExp(`^${district}$`, 'i') }
            };

            const officers = await User.find(query);
            logger.info(`Sending ${event} to ${officers.length} DGOs in district ${district}`);

            const promises = officers.map(officer => this.send(officer._id, event, data));
            await Promise.allSettled(promises);

            return { success: true, count: officers.length };
        } catch (error) {
            logger.error(`Error notifying district officers in ${district}`, error);
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
        const smsService = require('./sms.service');
        return smsService.formatMessage(event, data);
    }

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

    async getUserNotifications(userId, filters = {}) {
        try {
            const query = { userId };
            if (filters.isRead !== undefined) query.isRead = filters.isRead;
            if (filters.type) query.type = filters.type;
            if (filters.priority) query.priority = filters.priority;

            const notifications = await Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(filters.limit || 50);

            return notifications;
        } catch (error) {
            logger.error('Error fetching user notifications', error);
            throw error;
        }
    }

    async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification.findOneAndUpdate(
                { notificationId, userId },
                { isRead: true, readAt: new Date() },
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

    async markAllAsRead(userId) {
        try {
            const result = await Notification.updateMany(
                { userId, isRead: false },
                { isRead: true, readAt: new Date() }
            );
            logger.info(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);
            return result;
        } catch (error) {
            logger.error('Error marking all notifications as read', error);
            throw error;
        }
    }

    async getUnreadCount(userId) {
        try {
            return await Notification.countDocuments({ userId, isRead: false });
        } catch (error) {
            logger.error('Error getting unread count', error);
            throw error;
        }
    }

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
            return { message: 'Notification deleted successfully' };
        } catch (error) {
            logger.error('Error deleting notification', error);
            throw error;
        }
    }

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
