const fs = require('fs');
const path = require('path');
const TEMPLATES = require('./app/notifications/notification.templates');

const smsDir = path.join(__dirname, 'app/templates/sms');
const whatsappDir = path.join(__dirname, 'app/templates/whatsapp');

// Helper to write file
function writeTemplate(dir, filename, content) {
    if (!content) return;
    const filePath = path.join(dir, filename + '.txt');
    // If content is object (Twilio Content API), we might want to save it as JSON or skip
    if (typeof content === 'object') {
        const jsonPath = path.join(dir, filename + '.json');
        fs.writeFileSync(jsonPath, JSON.stringify(content, null, 2));
        console.log(`Created JSON config: ${jsonPath}`);
    } else {
        fs.writeFileSync(filePath, content.trim());
        console.log(`Created template: ${filePath}`);
    }
}

Object.keys(TEMPLATES).forEach(event => {
    const config = TEMPLATES[event];

    // SMS
    if (config.sms) {
        writeTemplate(smsDir, event, config.sms);
    }

    // WhatsApp
    if (config.whatsapp) {
        writeTemplate(whatsappDir, event, config.whatsapp);
    }
});
