const logger = require("../utils/logger");

class WhatsAppService {
    constructor() {
        this.provider = process.env.WHATSAPP_PROVIDER || 'twilio';
        this.enabled = process.env.WHATSAPP_ENABLED === 'true';
    }

    /**
     * Send WhatsApp notification
     */
    async sendNotification(data) {
        if (!this.enabled) {
            logger.info("WhatsApp notifications are disabled");
            return { success: false, reason: "WHATSAPP_DISABLED" };
        }

        try {
            const message = this.formatMessage(data.event, data);
            const recipients = this.getRecipients(data);

            const promises = recipients.map(phone => this.sendWhatsApp(phone, message));
            const results = await Promise.allSettled(promises);

            logger.info(`WhatsApp sent for event: ${data.event}`, {
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
            logger.error("WhatsApp service error", error);
            throw error;
        }
    }

    /**
     * Send WhatsApp message
     */
    async sendWhatsApp(phone, message) {
        switch (this.provider.toLowerCase()) {
            case 'twilio':
                return await this.sendViaTwilio(phone, message);
            default:
                logger.warn(`Unknown WhatsApp provider: ${this.provider}`);
                return { success: false };
        }
    }

    /**
     * Send via Twilio WhatsApp
     */
    /**
     * Send via Twilio WhatsApp
     */
    async sendViaTwilio(phone, messageOrData) {
        try {
            // Use provided credentials or env vars
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

            if (!authToken) {
                logger.warn("Twilio AUTH_TOKEN missing. WhatsApp sending skipped.", { accountSid });
                return { success: false, reason: "MISSING_CREDENTIALS" };
            }

            const client = require('twilio')(accountSid, authToken);

            // Check if we have template data (contentSid) or just plain text
            let msgOptions = {
                from: whatsappNumber,
                to: `whatsapp:${phone}`
            };

            // If messageOrData is an object with template info, use Content API
            if (typeof messageOrData === 'object' && messageOrData.contentSid) {
                msgOptions.contentSid = messageOrData.contentSid;
                msgOptions.contentVariables = JSON.stringify(messageOrData.contentVariables || {});
            } else {
                // Legacy/Fallback: Send plain text body
                msgOptions.body = typeof messageOrData === 'string' ? messageOrData : messageOrData.body || "Notification from SGWA";
                logger.debug(`Sending WhatsApp Body: ${msgOptions.body}`);
            }

            const message = await client.messages.create(msgOptions);

            logger.info(`WhatsApp sent via Twilio to ${phone}`, { sid: message.sid });
            return { success: true, sid: message.sid };
        } catch (error) {
            logger.error("Twilio WhatsApp error", error);
            // Don't throw to prevent blocking main flow, but return failure
            return { success: false, error: error.message };
        }
    }

    /**
     * Format WhatsApp message
     */
    /**
     * Format WhatsApp message
     */
    formatMessage(event, data) {
        const fs = require('fs');
        const path = require('path');

        const jsonPath = path.join(__dirname, `../templates/whatsapp/${event}.json`);
        const txtPath = path.join(__dirname, `../templates/whatsapp/${event}.txt`);
        const defaultPath = path.join(__dirname, `../templates/whatsapp/DEFAULT.txt`);

        // 1. Check for JSON Config (Content API)
        if (fs.existsSync(jsonPath)) {
            try {
                const templateConfig = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                if (templateConfig.contentSid) {
                    const processedVariables = {};
                    if (templateConfig.variables) {
                        for (const [key, val] of Object.entries(templateConfig.variables)) {
                            processedVariables[key] = this.replacePlaceholders(val, data);
                        }
                    }
                    return {
                        contentSid: templateConfig.contentSid,
                        contentVariables: processedVariables
                    };
                }
            } catch (e) {
                logger.error(`Error parsing WhatsApp template JSON for ${event}`, e);
            }
        }

        // 2. Check for Text File
        let templateContent = "";
        if (fs.existsSync(txtPath)) {
            templateContent = fs.readFileSync(txtPath, 'utf8');
        } else if (fs.existsSync(defaultPath)) {
            templateContent = fs.readFileSync(defaultPath, 'utf8');
        } else {
            // Fallback to SMS template if WhatsApp template missing?
            // For now, return default string
            return "Notification from SGWA";
        }

        return this.replacePlaceholders(templateContent, data);
    }

    replacePlaceholders(template, data) {
        if (!template) return "";
        return template
            .replace(/{{applicationNumber}}/g, data.applicationNumber || 'N/A')
            .replace(/{{projectName}}/g, data.projectName || '')
            .replace(/{{otp}}/g, data.otp || '')
            .replace(/{{deadline}}/g, data.deadline || '')
            .replace(/{{validity}}/g, data.validity || '');
    }

    /**
     * Get WhatsApp recipients
     */
    getRecipients(data) {
        const recipients = [];

        if (data.user?.phone) {
            recipients.push(this.formatPhoneNumber(data.user.phone));
        }

        if (data.company?.contactPhone) {
            recipients.push(this.formatPhoneNumber(data.company.contactPhone));
        }

        return [...new Set(recipients)];
    }

    /**
     * Send custom WhatsApp message
     */
    async sendCustomWhatsApp(phone, message) {
        if (!this.enabled) {
            logger.info("WhatsApp notifications are disabled");
            return { success: false, reason: "WHATSAPP_DISABLED" };
        }

        try {
            const formattedPhone = this.formatPhoneNumber(phone);
            const result = await this.sendWhatsApp(formattedPhone, message);

            logger.info(`Custom WhatsApp sent to ${formattedPhone}`);
            return { success: true, phone: formattedPhone, provider: this.provider };
        } catch (error) {
            logger.error(`Failed to send custom WhatsApp to ${phone}`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Format phone number for WhatsApp
     */
    formatPhoneNumber(phone) {
        phone = phone.replace(/[^0-9]/g, '');
        if (phone.length === 10) {
            return `+91${phone}`;
        }
        if (!phone.startsWith('+')) {
            return `+${phone}`;
        }
        return phone;
    }
}

module.exports = new WhatsAppService();
