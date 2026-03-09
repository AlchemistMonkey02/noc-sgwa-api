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
                data: notifications,
                count: notifications.length,
                message: "Notifications retrieved successfully"
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
                data: { unreadCount: count },
                message: "Unread count retrieved successfully"
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
                data: result,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/notifications/send - Send custom notification
     */
    async sendCustomNotification(req, res, next) {
        try {
            const { message, email, phone, channel } = req.body;

            // Validation
            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
            }

            if (!channel || !['email', 'sms', 'whatsapp'].includes(channel)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid channel is required (email, sms, or whatsapp)'
                });
            }

            // Check recipient based on channel
            if (channel === 'email' && !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required for email channel'
                });
            }

            if ((channel === 'sms' || channel === 'whatsapp') && !phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone is required for SMS/WhatsApp channel'
                });
            }

            // Send via selected channel
            let result;
            if (channel === 'email') {
                const emailService = require('../utils/email.service');
                result = await emailService.sendCustomEmail(email, 'Custom Notification', message);
            } else if (channel === 'sms') {
                const smsService = require('./sms.service');
                result = await smsService.sendCustomSMS(phone, message);
            } else if (channel === 'whatsapp') {
                const whatsappService = require('./whatsapp.service');
                result = await whatsappService.sendCustomWhatsApp(phone, message);
            }

            res.status(200).json({
                success: true,
                message: `Notification sent via ${channel}`,
                data: result
            });
        } catch (error) {
            logger.error('Send custom notification error:', error);
            next(error);
        }
    }

    /**
     * POST /api/notifications/send-application - Send template-based application notification
     */
    async sendApplicationNotification(req, res, next) {
        try {
            const {
                applicationId,
                applicantName,
                email,
                phone,
                channel,
                template,
                customMessage
            } = req.body;

            // Validation
            if (!applicationId || !applicantName) {
                return res.status(400).json({
                    success: false,
                    message: 'Application ID and applicant name are required'
                });
            }

            if (!channel || !['email', 'sms', 'whatsapp'].includes(channel)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid channel is required (email, sms, or whatsapp)'
                });
            }

            if (!template) {
                return res.status(400).json({
                    success: false,
                    message: 'Template type is required'
                });
            }

            // Check recipient based on channel
            if (channel === 'email' && !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required for email channel'
                });
            }

            if ((channel === 'sms' || channel === 'whatsapp') && !phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone is required for SMS/WhatsApp channel'
                });
            }

            // Template configuration with HTML file mapping
            const templates = {
                'document_verified': {
                    subject: 'Document Verification Successful',
                    htmlTemplate: 'document-verified.html'
                },
                'document_rejected': {
                    subject: 'Document Verification Failed',
                    htmlTemplate: 'document-rejected.html'
                },
                'application_submitted': {
                    subject: 'Application Submitted Successfully',
                    htmlTemplate: 'application-submitted.html'
                },
                'application_approved': {
                    subject: 'Application Approved',
                    htmlTemplate: 'application-approved.html'
                },
                'application_rejected': {
                    subject: 'Application Rejected',
                    htmlTemplate: 'application-rejected.html'
                },
                'payment_received': {
                    subject: 'Payment Received',
                    htmlTemplate: 'payment-received.html'
                },
                'query_raised': {
                    subject: 'Query Raised on Your Application',
                    htmlTemplate: 'query-raised.html'
                },
                'inspection_scheduled': {
                    subject: 'Site Inspection Scheduled',
                    htmlTemplate: 'inspection-scheduled.html'
                }
            };

            const templateData = templates[template];
            if (!templateData) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid template. Available: ${Object.keys(templates).join(', ')}`
                });
            }

            // Send via selected channel
            let result;
            if (channel === 'email') {
                const emailService = require('../utils/email.service');
                // Use HTML template for email
                result = await emailService.sendTemplateEmail(
                    email,
                    templateData.subject,
                    {
                        applicantName,
                        applicationId,
                        customMessage: customMessage || '',
                        date: new Date().toLocaleDateString('en-IN'),
                        portalUrl: process.env.PORTAL_URL || 'http://localhost:3000',
                        supportEmail: process.env.SUPPORT_EMAIL || 'support@sgwa.gov.in'
                    },
                    templateData.htmlTemplate
                );
            } else if (channel === 'sms') {
                const smsService = require('./sms.service');
                // For SMS, use plain text message
                const message = this.formatSMSMessage(template, applicantName, applicationId, customMessage);
                result = await smsService.sendCustomSMS(phone, message);
            } else if (channel === 'whatsapp') {
                const whatsappService = require('./whatsapp.service');
                // For WhatsApp, use WhatsApp-specific template with emoji and formatting
                const message = this.formatWhatsAppMessage(template, applicantName, applicationId, customMessage);
                result = await whatsappService.sendCustomWhatsApp(phone, message);
            }

            res.status(200).json({
                success: true,
                message: `Notification sent via ${channel}`,
                template: template,
                data: result
            });
        } catch (error) {
            logger.error('Send application notification error:', error);
            next(error);
        }
    }

    formatSMSMessage(template, applicantName, applicationId, customMessage) {
        const fs = require('fs');
        const path = require('path');

        // Map template names to file names
        const templateFileMap = {
            'document_verified': 'DOCUMENT_VERIFIED.txt',
            'document_rejected': 'DOCUMENT_REJECTED.txt',
            'application_submitted': 'APPLICATION_SUBMITTED.txt',
            'application_approved': 'SGWA_APPROVED.txt', // Using existing template
            'application_rejected': 'SGWA_REJECTED.txt', // Using existing template
            'payment_received': 'PAYMENT_RECEIVED.txt',
            'query_raised': 'SGWA_QUERY_RAISED.txt', // Using existing template
            'inspection_scheduled': 'INSPECTION_SCHEDULED.txt'
        };

        const templateFile = templateFileMap[template];
        if (!templateFile) {
            return `Notification for Application ID: ${applicationId} - SGWA`;
        }

        const templatePath = path.join(__dirname, `../templates/sms/${templateFile}`);

        try {
            if (fs.existsSync(templatePath)) {
                let message = fs.readFileSync(templatePath, 'utf8');
                // Replace placeholders
                message = message
                    .replace(/{{applicantName}}/g, applicantName)
                    .replace(/{{applicationNumber}}/g, applicationId)
                    .replace(/{{applicationId}}/g, applicationId);
                return message;
            }
        } catch (error) {
            logger.error(`Error loading SMS template: ${templateFile}`, error);
        }

        // Fallback messages if template file not found
        const fallbackMessages = {
            'document_verified': `Dear ${applicantName}, Your documents for Application ID: ${applicationId} have been successfully verified. - SGWA`,
            'document_rejected': `Dear ${applicantName}, Your documents for Application ID: ${applicationId} could not be verified. ${customMessage || 'Please resubmit.'} - SGWA`,
            'application_submitted': `Dear ${applicantName}, Your NOC application (ID: ${applicationId}) submitted successfully. - SGWA`,
            'application_approved': `Dear ${applicantName}, Congratulations! Application ${applicationId} approved. Download certificate from portal. - SGWA`,
            'application_rejected': `Dear ${applicantName}, Application ${applicationId} rejected. ${customMessage || 'Check portal.'} - SGWA`,
            'payment_received': `Dear ${applicantName}, Payment for ${applicationId} received. Processing will begin shortly. - SGWA`,
            'query_raised': `Dear ${applicantName}, Query raised on ${applicationId}. ${customMessage || 'Check portal.'} - SGWA`,
            'inspection_scheduled': `Dear ${applicantName}, Inspection for ${applicationId} scheduled. ${customMessage || 'Check portal.'} - SGWA`
        };
        return fallbackMessages[template] || `Notification for Application ID: ${applicationId} - SGWA`;
    }

    formatWhatsAppMessage(template, applicantName, applicationId, customMessage) {
        const fs = require('fs');
        const path = require('path');

        // Map template names to file names
        const templateFileMap = {
            'document_verified': 'DOCUMENT_VERIFIED.txt',
            'document_rejected': 'DOCUMENT_REJECTED.txt',
            'application_submitted': 'APPLICATION_SUBMITTED.txt',
            'application_approved': 'APPLICATION_APPROVED.txt',
            'application_rejected': 'APPLICATION_REJECTED.txt',
            'payment_received': 'PAYMENT_RECEIVED.txt',
            'query_raised': 'QUERY_RAISED.txt',
            'inspection_scheduled': 'INSPECTION_SCHEDULED.txt'
        };

        const templateFile = templateFileMap[template];
        if (!templateFile) {
            return `Notification for Application ID: ${applicationId}`;
        }

        const templatePath = path.join(__dirname, `../templates/whatsapp/${templateFile}`);

        try {
            if (fs.existsSync(templatePath)) {
                let message = fs.readFileSync(templatePath, 'utf8');
                // Replace placeholders
                message = message
                    .replace(/{{applicantName}}/g, applicantName)
                    .replace(/{{applicationNumber}}/g, applicationId)
                    .replace(/{{applicationId}}/g, applicationId)
                    .replace(/{{portalUrl}}/g, process.env.PORTAL_URL || 'http://localhost:3000')
                    .replace(/{{supportEmail}}/g, process.env.SUPPORT_EMAIL || 'support@sgwa.gov.in');
                return message;
            }
        } catch (error) {
            logger.error(`Error loading WhatsApp template: ${templateFile}`, error);
        }

        // Fallback to SMS format
        return this.formatSMSMessage(template, applicantName, applicationId, customMessage);
    }
}

module.exports = new NotificationController();
