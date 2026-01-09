const emailService = require('../utils/email.service');
const whatsappService = require('./whatsapp.service');
const smsService = require('./sms.service');
const notificationService = require('../notifications/notification.service');
const logger = require('../utils/logger');

/**
 * Unified Notification Dispatcher
 * Sends notifications through all channels: Email, WhatsApp, SMS, and In-App
 */
class NotificationDispatcher {
    /**
     * Send application submitted notifications
     */
    async sendApplicationSubmitted(user, application) {
        const promises = [];

        // 1. Send Email
        promises.push(
            emailService.sendApplicationSubmitted(user, application)
                .catch(err => logger.error('Email notification failed', err))
        );

        // 2. Send WhatsApp
        if (user.phone) {
            promises.push(
                whatsappService.sendApplicationSubmitted(
                    user.phone,
                    application.applicationNumber,
                    application.projectDetails.projectName
                ).catch(err => logger.error('WhatsApp notification failed', err))
            );
        }

        // 3. Send SMS
        if (user.phone) {
            promises.push(
                smsService.sendApplicationSubmitted(
                    user.phone,
                    application.applicationNumber
                ).catch(err => logger.error('SMS notification failed', err))
            );
        }

        // 4. Create In-App Notification
        promises.push(
            notificationService.createNotification(user._id, {
                type: 'APPLICATION_SUBMITTED',
                title: 'Application Submitted Successfully',
                message: `Your NOC application ${application.applicationNumber} has been submitted and is under review.`,
                priority: 'HIGH',
                relatedEntity: {
                    entityType: 'APPLICATION',
                    entityId: application.applicationId
                },
                actionUrl: `/applications/${application.applicationId}`
            }).catch(err => logger.error('In-app notification failed', err))
        );

        const results = await Promise.allSettled(promises);
        logger.info(`Notifications sent for application ${application.applicationNumber}`, {
            email: results[0].status,
            whatsapp: results[1]?.status,
            sms: results[2]?.status,
            inApp: results[3]?.status
        });

        return results;
    }

    /**
     * Send status update notifications
     */
    async sendStatusUpdate(user, application, newStatus) {
        const statusMessages = {
            'UNDER_REVIEW': 'Your application is now under review by our team',
            'QUERY_RAISED': 'A query has been raised. Please respond within 7 days.',
            'INSPECTION_SCHEDULED': 'Site inspection has been scheduled',
            'APPROVED': 'Congratulations! Your application has been approved',
            'REJECTED': 'Your application has been rejected',
            'NOC_ISSUED': 'Your NOC certificate has been issued'
        };

        const message = statusMessages[newStatus] || `Application status updated to ${newStatus}`;
        const promises = [];

        // Email - will be implemented when template is created
        // promises.push(emailService.sendApplicationStatusUpdate(user, application, newStatus));

        // WhatsApp
        if (user.phone) {
            promises.push(
                whatsappService.sendStatusUpdate(
                    user.phone,
                    application.applicationNumber,
                    newStatus,
                    message
                ).catch(err => logger.error('WhatsApp notification failed', err))
            );
        }

        // SMS
        if (user.phone) {
            promises.push(
                smsService.sendStatusUpdate(
                    user.phone,
                    application.applicationNumber,
                    newStatus
                ).catch(err => logger.error('SMS notification failed', err))
            );
        }

        // In-App
        promises.push(
            notificationService.createNotification(user._id, {
                type: 'STATUS_UPDATE',
                title: `Application Status: ${newStatus}`,
                message: message,
                priority: newStatus === 'QUERY_RAISED' ? 'URGENT' : 'MEDIUM',
                relatedEntity: {
                    entityType: 'APPLICATION',
                    entityId: application.applicationId
                },
                actionUrl: `/applications/${application.applicationId}`
            }).catch(err => logger.error('In-app notification failed', err))
        );

        await Promise.allSettled(promises);
        logger.info(`Status update notifications sent for ${application.applicationNumber}`);
    }

    /**
     * Send query raised notifications
     */
    async sendQueryRaised(user, application, query) {
        const promises = [];

        // WhatsApp
        if (user.phone) {
            promises.push(
                whatsappService.sendQueryRaised(
                    user.phone,
                    application.applicationNumber
                ).catch(err => logger.error('WhatsApp notification failed', err))
            );
        }

        // SMS
        if (user.phone) {
            promises.push(
                smsService.sendQueryRaised(
                    user.phone,
                    application.applicationNumber
                ).catch(err => logger.error('SMS notification failed', err))
            );
        }

        // In-App
        promises.push(
            notificationService.createNotification(user._id, {
                type: 'QUERY_RAISED',
                title: 'Query Raised on Application',
                message: `A query has been raised on your application ${application.applicationNumber}. Please respond within 7 days.`,
                priority: 'URGENT',
                relatedEntity: {
                    entityType: 'APPLICATION',
                    entityId: application.applicationId
                },
                actionUrl: `/applications/${application.applicationId}/respond`
            }).catch(err => logger.error('In-app notification failed', err))
        );

        await Promise.allSettled(promises);
        logger.info(`Query notifications sent for ${application.applicationNumber}`);
    }

    /**
     * Send NOC issued notifications
     */
    async sendNOCIssued(user, application, nocCertificate) {
        const promises = [];

        // WhatsApp
        if (user.phone) {
            promises.push(
                whatsappService.sendNOCIssued(
                    user.phone,
                    application.applicationNumber,
                    nocCertificate.nocNumber
                ).catch(err => logger.error('WhatsApp notification failed', err))
            );
        }

        // SMS
        if (user.phone) {
            promises.push(
                smsService.sendNOCIssued(
                    user.phone,
                    application.applicationNumber,
                    nocCertificate.nocNumber
                ).catch(err => logger.error('SMS notification failed', err))
            );
        }

        // In-App
        promises.push(
            notificationService.createNotification(user._id, {
                type: 'NOC_ISSUED',
                title: 'NOC Certificate Issued',
                message: `Your NOC certificate ${nocCertificate.nocNumber} has been issued. Download it now!`,
                priority: 'HIGH',
                relatedEntity: {
                    entityType: 'CERTIFICATE',
                    entityId: nocCertificate.certificateId
                },
                actionUrl: `/certificates/${nocCertificate.certificateId}`
            }).catch(err => logger.error('In-app notification failed', err))
        );

        await Promise.allSettled(promises);
        logger.info(`NOC issued notifications sent for ${application.applicationNumber}`);
    }
}

module.exports = new NotificationDispatcher();
