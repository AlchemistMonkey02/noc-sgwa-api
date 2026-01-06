const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    /**
     * Load HTML email template
     */
    loadTemplate(templateName) {
        try {
            const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
            return fs.readFileSync(templatePath, 'utf-8');
        } catch (error) {
            logger.error(`Failed to load email template: ${templateName}`, error);
            return null;
        }
    }

    /**
     * Replace placeholders in template
     */
    replacePlaceholders(template, data) {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value);
        }
        return result;
    }

    /**
     * Send welcome email on registration
     */
    async sendWelcomeEmail(user) {
        try {
            const template = this.loadTemplate('welcome');
            if (!template) return false;

            const html = this.replacePlaceholders(template, {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username || user.email,
                portalUrl: process.env.PORTAL_URL || 'http://localhost:5173',
                supportEmail: process.env.SUPPORT_EMAIL || 'support@sgwa.rajasthan.gov.in'
            });

            const mailOptions = {
                from: `"SGWA Portal" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: 'Welcome to SGWA Portal - Registration Successful',
                html: html
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Welcome email sent to ${user.email}`, { messageId: info.messageId });
            return true;
        } catch (error) {
            logger.error(`Failed to send welcome email to ${user.email}`, error);
            return false;
        }
    }

    /**
     * Send login notification email
     */
    async sendLoginNotification(user, loginInfo) {
        try {
            const template = this.loadTemplate('login-notification');
            if (!template) return false;

            const html = this.replacePlaceholders(template, {
                firstName: user.firstName,
                loginTime: loginInfo.loginTime || new Date().toLocaleString(),
                ipAddress: loginInfo.ipAddress || 'Unknown',
                deviceInfo: loginInfo.deviceInfo || 'Unknown',
                location: loginInfo.location || 'Unknown',
                portalUrl: process.env.PORTAL_URL || 'http://localhost:5173',
                supportEmail: process.env.SUPPORT_EMAIL || 'support@sgwa.rajasthan.gov.in'
            });

            const mailOptions = {
                from: `"SGWA Security Alert" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: 'SGWA Portal - New Login Detected',
                html: html
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Login notification sent to ${user.email}`, { messageId: info.messageId });
            return true;
        } catch (error) {
            logger.error(`Failed to send login notification to ${user.email}`, error);
            return false;
        }
    }

    /**
     * Send application submitted confirmation email
     */
    async sendApplicationSubmitted(user, application) {
        try {
            const template = this.loadTemplate('application-submitted');
            if (!template) return false;

            const html = this.replacePlaceholders(template, {
                firstName: user.firstName,
                applicationNumber: application.applicationNumber,
                applicationType: application.applicationType,
                projectName: application.projectDetails?.projectName || 'N/A',
                submittedDate: new Date(application.submittedDate).toLocaleDateString(),
                trackingUrl: `${process.env.PORTAL_URL}/applications/track/${application.applicationId}`,
                estimatedDays: application.estimatedProcessingDays || 60,
                portalUrl: process.env.PORTAL_URL || 'http://localhost:5173',
                supportEmail: process.env.SUPPORT_EMAIL || 'support@sgwa.rajasthan.gov.in'
            });

            const mailOptions = {
                from: `"SGWA Portal" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: `Application Submitted - ${application.applicationNumber}`,
                html: html
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Application submission email sent to ${user.email}`, {
                applicationId: application.applicationId,
                messageId: info.messageId
            });
            return true;
        } catch (error) {
            logger.error(`Failed to send application submission email to ${user.email}`, error);
            return false;
        }
    }

    /**
     * Send query raised notification
     */
    async sendQueryRaised(user, application, query) {
        try {
            const template = this.loadTemplate('query-raised');
            if (!template) return false;

            const html = this.replacePlaceholders(template, {
                firstName: user.firstName,
                applicationNumber: application.applicationNumber,
                queryText: query.query,
                queryDate: new Date(query.raisedDate).toLocaleDateString(),
                responseDeadline: query.responseDeadline || 'Within 7 days',
                applicationUrl: `${process.env.PORTAL_URL}/applications/${application.applicationId}`,
                portalUrl: process.env.PORTAL_URL || 'http://localhost:5173',
                supportEmail: process.env.SUPPORT_EMAIL || 'support@sgwa.rajasthan.gov.in'
            });

            const mailOptions = {
                from: `"SGWA Portal" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: `Query Raised - ${application.applicationNumber}`,
                html: html
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Query notification sent to ${user.email}`, { messageId: info.messageId });
            return true;
        } catch (error) {
            logger.error(`Failed to send query notification to ${user.email}`, error);
            return false;
        }
    }

    /**
     * Send application approved notification
     */
    async sendApplicationApproved(user, application, nocCertificate) {
        try {
            const template = this.loadTemplate('application-approved');
            if (!template) return false;

            const html = this.replacePlaceholders(template, {
                firstName: user.firstName,
                applicationNumber: application.applicationNumber,
                nocNumber: nocCertificate.nocNumber,
                approvedDate: new Date(nocCertificate.issueDate).toLocaleDateString(),
                validUpto: new Date(nocCertificate.validUpto).toLocaleDateString(),
                certificateUrl: `${process.env.PORTAL_URL}/noc/${nocCertificate.nocId}/certificate`,
                portalUrl: process.env.PORTAL_URL || 'http://localhost:5173',
                supportEmail: process.env.SUPPORT_EMAIL || 'support@sgwa.rajasthan.gov.in'
            });

            const mailOptions = {
                from: `"SGWA Portal" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: `Application Approved - NOC ${nocCertificate.nocNumber}`,
                html: html
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Approval notification sent to ${user.email}`, { messageId: info.messageId });
            return true;
        } catch (error) {
            logger.error(`Failed to send approval notification to ${user.email}`, error);
            return false;
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(user, resetToken) {
        try {
            const template = this.loadTemplate('password-reset');
            if (!template) return false;

            const resetUrl = `${process.env.PORTAL_URL}/auth/reset-password?token=${resetToken}`;

            const html = this.replacePlaceholders(template, {
                firstName: user.firstName,
                resetUrl: resetUrl,
                expiryTime: '1 hour',
                portalUrl: process.env.PORTAL_URL || 'http://localhost:5173',
                supportEmail: process.env.SUPPORT_EMAIL || 'support@sgwa.rajasthan.gov.in'
            });

            const mailOptions = {
                from: `"SGWA Portal" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: 'SGWA Portal - Password Reset Request',
                html: html
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Password reset email sent to ${user.email}`, { messageId: info.messageId });
            return true;
        } catch (error) {
            logger.error(`Failed to send password reset email to ${user.email}`, error);
            return false;
        }
    }
}

module.exports = new EmailService();
