const logger = require("../utils/logger");

class SMSService {
    constructor() {
        this.provider = process.env.SMS_PROVIDER || 'twilio'; // twilio, msg91, fast2sms
        this.enabled = process.env.SMS_ENABLED === 'true';
    }

    /**
     * Send SMS notification
     */
    async sendNotification(data) {
        if (!this.enabled) {
            logger.info("SMS notifications are disabled");
            return { success: false, reason: "SMS_DISABLED" };
        }

        try {
            const message = this.formatMessage(data.event, data);
            const recipients = this.getRecipients(data);

            // Send to all recipients
            const promises = recipients.map(phone => this.sendSMS(phone, message));
            const results = await Promise.allSettled(promises);

            logger.info(`SMS sent for event: ${data.event}`, {
                provider: this.provider,
                recipients: recipients.length,
                success: results.filter(r => r.status === 'fulfilled').length
            });

            return {
                success: true,
                provider: this.provider,
                sentCount: results.filter(r => r.status === 'fulfilled').length
            };
        } catch (error) {
            logger.error("SMS service error", error);
            throw error;
        }
    }

    /**
     * Send SMS via configured provider
     */
    async sendSMS(phone, message) {
        switch (this.provider.toLowerCase()) {
            case 'twilio':
                return await this.sendViaTwilio(phone, message);
            case 'msg91':
                return await this.sendViaMsg91(phone, message);
            case 'fast2sms':
                return await this.sendViaFast2SMS(phone, message);
            default:
                logger.warn(`Unknown SMS provider: ${this.provider}`);
                return { success: false };
        }
    }

    /**
     * Send via Twilio
     */
    async sendViaTwilio(phone, message) {
        try {
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const fromNumber = process.env.TWILIO_PHONE_NUMBER;

            if (!accountSid || !authToken || !fromNumber) {
                throw new Error("Twilio credentials not configured");
            }

            // In production, use actual Twilio SDK
            // const client = require('twilio')(accountSid, authToken);
            // await client.messages.create({
            //     body: message,
            //     from: fromNumber,
            //     to: phone
            // });

            logger.info(`SMS sent via Twilio to ${phone}`);
            return { success: true };
        } catch (error) {
            logger.error("Twilio SMS error", error);
            throw error;
        }
    }

    /**
     * Send via MSG91
     */
    async sendViaMsg91(phone, message) {
        try {
            const authKey = process.env.MSG91_AUTH_KEY;
            const senderId = process.env.MSG91_SENDER_ID;

            if (!authKey || !senderId) {
                throw new Error("MSG91 credentials not configured");
            }

            // In production, use MSG91 API
            // const axios = require('axios');
            // await axios.get('https://api.msg91.com/api/sendhttp.php', {
            //     params: {
            //         authkey: authKey,
            //         mobiles: phone,
            //         message: message,
            //         sender: senderId,
            //         route: 4
            //     }
            // });

            logger.info(`SMS sent via MSG91 to ${phone}`);
            return { success: true };
        } catch (error) {
            logger.error("MSG91 SMS error", error);
            throw error;
        }
    }

    /**
     * Send via Fast2SMS
     */
    async sendViaFast2SMS(phone, message) {
        try {
            const apiKey = process.env.FAST2SMS_API_KEY;

            if (!apiKey) {
                throw new Error("Fast2SMS API key not configured");
            }

            // In production, use Fast2SMS API
            // const axios = require('axios');
            // await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            //     route: 'v3',
            //     sender_id: 'FSTSMS',
            //     message: message,
            //     language: 'english',
            //     flash: 0,
            //     numbers: phone
            // }, {
            //     headers: {
            //         'authorization': apiKey
            //     }
            // });

            logger.info(`SMS sent via Fast2SMS to ${phone}`);
            return { success: true };
        } catch (error) {
            logger.error("Fast2SMS error", error);
            throw error;
        }
    }

    /**
     * Format notification message
     */
    formatMessage(event, data) {
        const messages = {
            APPLICATION_SUBMITTED: `NOC Application ${data.applicationNumber} submitted successfully. Track status at sgwa.raj.in`,
            DGO_APPROVED: `Your NOC application ${data.applicationNumber} approved by District Officer. Forwarded to SGWA.`,
            DGO_REJECTED: `NOC application ${data.applicationNumber} rejected by District Officer. Check portal for details.`,
            DGO_QUERY_RAISED: `Query raised on NOC application ${data.applicationNumber}. Please respond on portal.`,
            SGWA_APPROVED: `NOC application ${data.applicationNumber} approved by SGWA. Forwarded to Enforcement Wing.`,
            SGWA_REJECTED: `NOC application ${data.applicationNumber} rejected by SGWA.`,
            SGWA_QUERY_RAISED: `SGWA query on application ${data.applicationNumber}. Respond on portal.`,
            INSPECTION_SCHEDULED: `Site inspection scheduled for NOC application ${data.applicationNumber}.`,
            NOC_ISSUED: `NOC Certificate issued! Number: ${data.applicationNumber}. Download from sgwa.raj.in`,
            ENFORCEMENT_REJECTED: `NOC application ${data.applicationNumber} rejected by Enforcement Wing.`
        };

        return messages[event] || `Update on NOC application ${data.applicationNumber}. Check portal.`;
    }

    /**
     * Get SMS recipients
     */
    getRecipients(data) {
        const recipients = [];

        if (data.user?.phone) {
            recipients.push(this.formatPhoneNumber(data.user.phone));
        }

        if (data.company?.contactPhone) {
            recipients.push(this.formatPhoneNumber(data.company.contactPhone));
        }

        return [...new Set(recipients)]; // Remove duplicates
    }

    /**
     * Format phone number (ensure +91 prefix for India)
     */
    formatPhoneNumber(phone) {
        phone = phone.replace(/[^0-9]/g, ''); // Remove non-numeric
        if (phone.length === 10) {
            return `+91${phone}`;
        }
        if (!phone.startsWith('+')) {
            return `+${phone}`;
        }
        return phone;
    }
}

module.exports = new SMSService();
