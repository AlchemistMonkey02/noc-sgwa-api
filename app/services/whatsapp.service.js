const twilio = require('twilio');
const logger = require('../utils/logger');

class WhatsAppService {
    constructor() {
        // Check if Twilio is configured
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
            try {
                this.client = twilio(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );
                this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
            } catch (error) {
                logger.error('Failed to initialize Twilio WhatsApp client:', error.message);
                this.client = null;
            }
        } else {
            logger.warn('WhatsApp/Twilio not configured or invalid SID. WhatsApp notifications will be disabled.');
            this.client = null;
        }
    }

    async sendApplicationSubmitted(phone, applicationNumber, projectName) {
        if (!this.client) {
            logger.warn(`WhatsApp not configured. Message not sent to ${phone}`);
            return { success: false, message: 'WhatsApp not configured' };
        }

        try {
            const message = `🎉 *Application Submitted Successfully*\n\n` +
                `Application No: *${applicationNumber}*\n` +
                `Project: ${projectName}\n\n` +
                `Your NOC application has been submitted and is under review.\n\n` +
                `Track your application: ${process.env.PORTAL_URL}/applications\n\n` +
                `_SGWA - Rajasthan Ground Water Department_`;

            const result = await this.client.messages.create({
                from: this.whatsappNumber,
                to: `whatsapp:+91${phone}`,
                body: message
            });

            logger.info(`WhatsApp sent to ${phone}`, { sid: result.sid });
            return { success: true, sid: result.sid };
        } catch (error) {
            logger.error(`Failed to send WhatsApp to ${phone}`, error.message);
            return { success: false, error: error.message };
        }
    }

    async sendStatusUpdate(phone, applicationNumber, status, statusMessage) {
        if (!this.client) return { success: false, message: 'WhatsApp not configured' };

        try {
            const message = `📋 *Application Status Update*\n\n` +
                `Application: *${applicationNumber}*\n` +
                `Status: *${status}*\n\n` +
                `${statusMessage}\n\n` +
                `View details: ${process.env.PORTAL_URL}/applications\n\n` +
                `_SGWA Rajasthan_`;

            const result = await this.client.messages.create({
                from: this.whatsappNumber,
                to: `whatsapp:+91${phone}`,
                body: message
            });

            return { success: true, sid: result.sid };
        } catch (error) {
            logger.error(`Failed to send WhatsApp to ${phone}`, error.message);
            return { success: false, error: error.message };
        }
    }

    async sendQueryRaised(phone, applicationNumber) {
        if (!this.client) return { success: false };

        try {
            const message = `⚠️ *Query Raised on Application*\n\n` +
                `Application: *${applicationNumber}*\n\n` +
                `A query has been raised on your application.\n` +
                `Please login to respond within 7 days.\n\n` +
                `Respond now: ${process.env.PORTAL_URL}/applications\n\n` +
                `_SGWA Rajasthan_`;

            const result = await this.client.messages.create({
                from: this.whatsappNumber,
                to: `whatsapp:+91${phone}`,
                body: message
            });

            return { success: true, sid: result.sid };
        } catch (error) {
            logger.error(`Failed to send WhatsApp to ${phone}`, error.message);
            return { success: false, error: error.message };
        }
    }

    async sendNOCIssued(phone, applicationNumber, nocNumber) {
        if (!this.client) return { success: false };

        try {
            const message = `✅ *NOC Certificate Issued*\n\n` +
                `Application: *${applicationNumber}*\n` +
                `NOC Number: *${nocNumber}*\n\n` +
                `Congratulations! Your NOC has been issued.\n\n` +
                `Download: ${process.env.PORTAL_URL}/certificates\n\n` +
                `_SGWA Rajasthan_`;

            const result = await this.client.messages.create({
                from: this.whatsappNumber,
                to: `whatsapp:+91${phone}`,
                body: message
            });

            return { success: true, sid: result.sid };
        } catch (error) {
            logger.error(`Failed to send WhatsApp to ${phone}`, error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new WhatsAppService();
