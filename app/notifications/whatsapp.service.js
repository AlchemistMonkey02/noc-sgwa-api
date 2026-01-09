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
    async sendViaTwilio(phone, message) {
        try {
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., 'whatsapp:+14155238886'

            if (!accountSid || !authToken || !whatsappNumber) {
                throw new Error("Twilio WhatsApp credentials not configured");
            }

            // In production, use actual Twilio SDK
            // const client = require('twilio')(accountSid, authToken);
            // await client.messages.create({
            //     body: message,
            //     from: whatsappNumber,
            //     to: `whatsapp:${phone}`
            // });

            logger.info(`WhatsApp sent via Twilio to ${phone}`);
            return { success: true };
        } catch (error) {
            logger.error("Twilio WhatsApp error", error);
            throw error;
        }
    }

    /**
     * Format WhatsApp message
     */
    formatMessage(event, data) {
        const messages = {
            APPLICATION_SUBMITTED: `✅ *NOC Application Submitted*\n\nApplication No: ${data.applicationNumber}\nProject: ${data.projectName}\n\nTrack your application at sgwa.raj.in`,

            DGO_APPROVED: `✅ *DGO Approval Received*\n\nYour NOC application ${data.applicationNumber} has been approved by the District Groundwater Officer.\n\n✨ Next Step: SGWA Technical Review\n\nCheck sgwa.raj.in for updates.`,

            DGO_REJECTED: `❌ *Application Rejected by DGO*\n\nNOC Application: ${data.applicationNumber}\n\nPlease check the portal for detailed remarks and next steps.`,

            DGO_QUERY_RAISED: `❓ *Query Raised by DGO*\n\nApplication No: ${data.applicationNumber}\n\n⏰ Please respond to the query on the portal within the deadline.`,

            SGWA_APPROVED: `✅ *SGWA Approval Received*\n\nYour NOC application ${data.applicationNumber} has been approved by SGWA.\n\n✨ Next Step: Enforcement Wing Final Review\n\nCheck sgwa.raj.in for updates.`,

            SGWA_REJECTED: `❌ *Application Rejected by SGWA*\n\nNOC Application: ${data.applicationNumber}\n\nCheck portal for detailed technical remarks.`,

            SGWA_QUERY_RAISED: `❓ *SGWA Query*\n\nApplication No: ${data.applicationNumber}\n\nSGWA has raised a technical query. Please respond on the portal.`,

            INSPECTION_SCHEDULED: `📅 *Site Inspection Scheduled*\n\nApplication No: ${data.applicationNumber}\n\nOur field team will conduct a site inspection soon. Please ensure accessibility to the site.\n\nDetails available on portal.`,

            NOC_ISSUED: `🎉 *NOC Certificate Issued!*\n\nCongratulations! Your NOC has been issued.\n\nNOC Number: ${data.applicationNumber}\nProject: ${data.projectName}\n\n📥 Download your certificate from sgwa.raj.in`,

            ENFORCEMENT_REJECTED: `❌ *Application Rejected*\n\nNOC Application: ${data.applicationNumber}\n\nFinal rejection by Enforcement Wing. Check portal for appeal process.`
        };

        return messages[event] || `Update on your NOC application ${data.applicationNumber}. Check sgwa.raj.in for details.`;
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
