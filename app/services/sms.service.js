const twilio = require('twilio');
const logger = require('../utils/logger');

class SMSService {
    constructor() {
        // Check if Twilio is configured
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
            try {
                this.client = twilio(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );
                this.smsNumber = process.env.TWILIO_SMS_NUMBER;
            } catch (error) {
                logger.error('Failed to initialize Twilio client:', error.message);
                this.client = null;
            }
        } else {
            logger.warn('SMS/Twilio not configured or invalid SID. SMS notifications will be disabled.');
            this.client = null;
        }
    }

    async sendApplicationSubmitted(phone, applicationNumber) {
        if (!this.client) {
            logger.warn(`SMS not configured. Message not sent to ${phone}`);
            return { success: false, message: 'SMS not configured' };
        }

        try {
            const message = `SGWA: Application ${applicationNumber} submitted successfully. ` +
                `Track status at ${process.env.PORTAL_URL}/applications`;

            const result = await this.client.messages.create({
                from: this.smsNumber,
                to: `+91${phone}`,
                body: message
            });

            logger.info(`SMS sent to ${phone}`, { sid: result.sid });
            return { success: true, sid: result.sid };
        } catch (error) {
            logger.error(`Failed to send SMS to ${phone}`, error.message);
            return { success: false, error: error.message };
        }
    }

    async sendStatusUpdate(phone, applicationNumber, status) {
        if (!this.client) return { success: false };

        try {
            const message = `SGWA: Application ${applicationNumber} status updated to ${status}. ` +
                `Login to view details.`;

            const result = await this.client.messages.create({
                from: this.smsNumber,
                to: `+91${phone}`,
                body: message
            });

            return { success: true, sid: result.sid };
        } catch (error) {
            logger.error(`Failed to send SMS to ${phone}`, error.message);
            return { success: false, error: error.message };
        }
    }

    async sendQueryRaised(phone, applicationNumber) {
        if (!this.client) return { success: false };

        try {
            const message = `SGWA: Query raised on application ${applicationNumber}. ` +
                `Please respond within 7 days. Login to view.`;

            const result = await this.client.messages.create({
                from: this.smsNumber,
                to: `+91${phone}`,
                body: message
            });

            return { success: true, sid: result.sid };
        } catch (error) {
            logger.error(`Failed to send SMS to ${phone}`, error.message);
            return { success: false, error: error.message };
        }
    }

    async sendNOCIssued(phone, applicationNumber, nocNumber) {
        if (!this.client) return { success: false };

        try {
            const message = `SGWA: NOC ${nocNumber} issued for application ${applicationNumber}. ` +
                `Download at ${process.env.PORTAL_URL}/certificates`;

            const result = await this.client.messages.create({
                from: this.smsNumber,
                to: `+91${phone}`,
                body: message
            });

            return { success: true, sid: result.sid };
        } catch (error) {
            logger.error(`Failed to send SMS to ${phone}`, error.message);
            return { success: false, error: error.message };
        }
    }

    async sendOTP(phone, otp) {
        if (!this.client) {
            logger.warn(`SMS not configured. OTP not sent to ${phone}. OTP: ${otp}`);
            return { success: false, message: 'SMS not configured' };
        }

        try {
            const message = `SGWA: Your OTP for login/registration is ${otp}. Valid for 10 minutes. Do not share.`;

            const result = await this.client.messages.create({
                from: this.smsNumber,
                to: `+91${phone}`,
                body: message
            });

            logger.info(`OTP SMS sent to ${phone}`);
            return { success: true, sid: result.sid };
        } catch (error) {
            logger.error(`Failed to send OTP SMS to ${phone}`, error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new SMSService();
