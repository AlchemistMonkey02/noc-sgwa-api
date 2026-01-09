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
                .replace(/{{portalUrl}}/g, process.env.PORTAL_URL || "http://localhost:3000")
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
                .replace(/{{portalUrl}}/g, process.env.PORTAL_URL || "http://localhost:3000")
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
                .replace(/{{portalUrl}}/g, process.env.PORTAL_URL || "http://localhost:3000")
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
}

module.exports = new EmailService();
