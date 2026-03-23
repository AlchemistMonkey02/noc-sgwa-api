const nodemailer = require("nodemailer");
const logger = require("./logger");
const fs = require("fs");
const path = require("path");

// Check if SMTP is configured
const isSmtpConfigured = () => {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_HOST);
};

// Create transporter only if SMTP is configured
let transporter = null;
if (isSmtpConfigured()) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
} else {
    logger.warn("SMTP not configured. Email notifications will be disabled.");
}

class EmailService {
    async sendWelcomeEmail(user) {
        try {
            if (!transporter) {
                logger.warn(`SMTP not configured. Welcome email not sent to ${user.email}`);
                return { success: false, message: "SMTP not configured" };
            }

            const templatePath = path.join(__dirname, "../templates/emails/welcome.html");
            let htmlContent = fs.readFileSync(templatePath, "utf8");

            // Replace placeholders
            htmlContent = htmlContent
                .replace(/{{firstName}}/g, user.firstName)
                .replace(/{{lastName}}/g, user.lastName)
                .replace(/{{email}}/g, user.email)
                .replace(/{{username}}/g, user.username || user.email)
                .replace(/{{portalUrl}}/g, process.env.PORTAL_URL || "")
                .replace(/{{supportEmail}}/g, process.env.SUPPORT_EMAIL || "support@sgwa.gov.in");

            const mailOptions = {
                from: `"SGWA Portal" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: "Welcome to SGWA Portal - Registration Successful",
                html: htmlContent,
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Welcome email sent to ${user.email}`, {
                messageId: info.messageId,
            });

            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error(`Failed to send welcome email to ${user.email}`, error.message);
            // Don't throw - email failure shouldn't block registration
            return { success: false, error: error.message };
        }
    }

    async sendLoginNotification(user, loginInfo) {
        try {
            if (!transporter) {
                logger.warn(`SMTP not configured. Login notification not sent to ${user.email}`);
                return { success: false, message: "SMTP not configured" };
            }

            const templatePath = path.join(__dirname, "../templates/emails/login-notification.html");
            let htmlContent = fs.readFileSync(templatePath, "utf8");

            htmlContent = htmlContent
                .replace(/{{firstName}}/g, user.firstName)
                .replace(/{{loginTime}}/g, loginInfo.loginTime || new Date().toLocaleString())
                .replace(/{{ipAddress}}/g, loginInfo.ipAddress || "Unknown")
                .replace(/{{deviceInfo}}/g, loginInfo.deviceInfo || "Unknown")
                .replace(/{{location}}/g, loginInfo.location || "Unknown")
                .replace(/{{portalUrl}}/g, process.env.PORTAL_URL || "")
                .replace(/{{supportEmail}}/g, process.env.SUPPORT_EMAIL || "support@sgwa.gov.in");

            const mailOptions = {
                from: `"SGWA Portal" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: "New Login to Your SGWA Account",
                html: htmlContent,
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Login notification sent to ${user.email}`);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error(`Failed to send login notification to ${user.email}`, error.message);
            return { success: false, error: error.message };
        }
    }

    async sendApplicationSubmitted(user, applicationData) {
        try {
            if (!transporter) {
                logger.warn(`SMTP not configured. Application email not sent to ${user.email}`);
                return { success: false, message: "SMTP not configured" };
            }

            const templatePath = path.join(__dirname, "../templates/emails/application-submitted.html");
            let htmlContent = fs.readFileSync(templatePath, "utf8");

            htmlContent = htmlContent
                .replace(/{{firstName}}/g, user.firstName)
                .replace(/{{applicationNumber}}/g, applicationData.applicationNumber)
                .replace(/{{applicationType}}/g, applicationData.applicationType)
                .replace(/{{projectName}}/g, applicationData.projectDetails?.projectName || "N/A")
                .replace(/{{submittedDate}}/g, new Date(applicationData.submittedDate).toLocaleDateString())
                .replace(/{{portalUrl}}/g, process.env.PORTAL_URL || "")
                .replace(/{{applicationId}}/g, applicationData.applicationId)
                .replace(/{{supportEmail}}/g, process.env.SUPPORT_EMAIL || "support@sgwa.gov.in");

            const mailOptions = {
                from: `"SGWA Portal" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: `Application Submitted - ${applicationData.applicationNumber}`,
                html: htmlContent,
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Application submitted email sent to ${user.email}`);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error(`Failed to send application email to ${user.email}`, error.message);
            return { success: false, error: error.message };
        }
    }

    async sendPasswordReset(user, resetToken) {
        try {
            if (!transporter) {
                logger.warn(`SMTP not configured. Password reset email not sent to ${user.email}`);
                return { success: false, message: "SMTP not configured" };
            }

            const resetUrl = `${process.env.PORTAL_URL}/reset-password?token=${resetToken}`;

            const mailOptions = {
                from: `"SGWA Portal" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: "Password Reset Request - SGWA Portal",
                html: `
                    <h2>Password Reset Request</h2>
                    <p>Hi ${user.firstName},</p>
                    <p>You requested a password reset. Click the link below to reset your password:</p>
                    <p><a href="${resetUrl}">${resetUrl}</a></p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `,
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Password reset email sent to ${user.email}`);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error(`Failed to send password reset email to ${user.email}`, error.message);
            return { success: false, error: error.message };
        }
    }
    async sendNotification(event, user, data) {
        const TEMPLATES = require('../notifications/notification.templates');

        switch (event) {
            case 'USER_REGISTERED':
                return this.sendWelcomeEmail({ ...user, username: user.email });
            case 'LOGIN':
                return this.sendLoginNotification(user, data);
            case 'APPLICATION_SUBMITTED':
                return this.sendApplicationSubmitted(user, data);
            case 'PASSWORD_RESET':
                return { success: true, message: "Handled by specific auth flow" };
            default:
                // Use centralized template configuration
                const config = TEMPLATES[event] ? TEMPLATES[event].email : TEMPLATES.DEFAULT.email;
                const subject = config.subject || `Notification: ${event}`;
                // Merge extra template data (like authorityName)
                const enrichedData = { ...data, ...config.extraData, event };

                return this.sendGenericEmail(user, subject, enrichedData, config.templateFile);
        }
    }

    async sendGenericEmail(user, subject, data, templateName = "generic-notification.html") {
        try {
            if (!transporter) return { success: false, message: "SMTP not configured" };

            // Resolve message body from data or helper
            // For templates using {{message}}, we often want the remarks or description
            const messageBody = data.message || data.remarks || this.formatGenericMessage(data.event || 'Notification', data);

            const templatePath = path.join(__dirname, `../templates/emails/${templateName}`);

            // Fallback to simple HTML if file not found
            let htmlContent;
            if (fs.existsSync(templatePath)) {
                htmlContent = fs.readFileSync(templatePath, "utf8");
                htmlContent = htmlContent
                    .replace(/{{firstName}}/g, user.firstName)
                    .replace(/{{message}}/g, messageBody)
                    .replace(/{{applicationNumber}}/g, data.applicationNumber || 'N/A')
                    .replace(/{{projectName}}/g, data.projectName || 'N/A')
                    .replace(/{{date}}/g, new Date().toLocaleDateString())
                    .replace(/{{portalUrl}}/g, process.env.PORTAL_URL || "")
                    .replace(/{{authorityName}}/g, data.authorityName || 'Authority')
                    .replace(/{{otp}}/g, data.otp || '')
                    .replace(/{{inspectionDate}}/g, data.inspectionDate ? new Date(data.inspectionDate).toLocaleDateString() : 'TBD')
                    .replace(/{{supportEmail}}/g, process.env.SUPPORT_EMAIL || "support@sgwa.gov.in");
            } else {
                htmlContent = `<p>Dear ${user.firstName},</p><p>${messageBody}</p><p>Visit portal for details.</p>`;
            }

            const mailOptions = {
                from: `"SGWA Portal" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: subject,
                html: htmlContent,
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Generic email sent to ${user.email} for ${subject}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error(`Failed to send generic email to ${user.email}`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send custom email with plain message
     */
    async sendCustomEmail(email, subject, message) {
        try {
            if (!transporter) {
                logger.warn(`SMTP not configured. Custom email not sent to ${email}`);
                return { success: false, message: "SMTP not configured" };
            }

            const mailOptions = {
                from: `"SGWA Portal" <${process.env.SMTP_USER}>`,
                to: email,
                subject: subject,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <p>${message}</p>
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                        <p style="font-size: 12px; color: #666;">
                            This is an automated notification from SGWA Portal.<br>
                            For support, contact: ${process.env.SUPPORT_EMAIL || 'support@sgwa.gov.in'}
                        </p>
                    </div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Custom email sent to ${email}`);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error(`Failed to send custom email to ${email}`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send email using HTML template
     */
    async sendTemplateEmail(email, subject, data, templateName) {
        try {
            if (!transporter) {
                logger.warn(`SMTP not configured. Template email not sent to ${email}`);
                return { success: false, message: "SMTP not configured" };
            }

            const templatePath = path.join(__dirname, `../templates/emails/${templateName}`);

            if (!fs.existsSync(templatePath)) {
                logger.error(`Template not found: ${templateName}`);
                return { success: false, error: `Template ${templateName} not found` };
            }

            let htmlContent = fs.readFileSync(templatePath, "utf8");

            // Replace all placeholders
            htmlContent = htmlContent
                .replace(/{{applicantName}}/g, data.applicantName || '')
                .replace(/{{applicationId}}/g, data.applicationId || '')
                .replace(/{{customMessage}}/g, data.customMessage || '')
                .replace(/{{date}}/g, data.date || new Date().toLocaleDateString())
                .replace(/{{portalUrl}}/g, data.portalUrl || process.env.PORTAL_URL || '')
                .replace(/{{supportEmail}}/g, data.supportEmail || process.env.SUPPORT_EMAIL || 'support@sgwa.gov.in');

            const mailOptions = {
                from: `"SGWA Portal" <${process.env.SMTP_USER}>`,
                to: email,
                subject: subject,
                html: htmlContent
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Template email sent to ${email} using ${templateName}`);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error(`Failed to send template email to ${email}`, error.message);
            return { success: false, error: error.message };
        }
    }

    formatGenericMessage(event, data) {
        // Use the SMS formatter since we externalized the templates
        const smsService = require('../notifications/sms.service');
        return smsService.formatMessage(event, data);
    }
}

module.exports = new EmailService();
