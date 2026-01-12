require('dotenv').config();
// Set Credentials
process.env.SMS_ENABLED = 'true';
process.env.SMS_PROVIDER = 'twilio';
process.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
process.env.TWILIO_PHONE_NUMBER = '+18148592426';
process.env.WHATSAPP_ENABLED = 'true';
process.env.WHATSAPP_PROVIDER = 'twilio';
process.env.SMTP_HOST = 'smtp.hostinger.com';
process.env.SMTP_PORT = '465';
process.env.SMTP_USER = 'rgwcma@geoplanetsolution.com';
process.env.SMTP_PASS = 'Rgwcma@12345';

const notificationService = require('./app/notifications/notification.service');
// Mock Notification model to avoid DB errors
const Notification = require('./app/notifications/notification.model');
Notification.prototype.save = async function () { console.log("   (Mock) Notification saved to DB"); };

async function testUnified() {
    console.log("Testing Unified Notification Dispatch...");

    const user = {
        _id: 'dummy_id',
        email: 'alwanivinod10@gmail.com',
        phone: '917300359061',
        firstName: 'Vinod',
        username: 'alwanivinod'
    };

    const data = {
        applicationNumber: 'NOC/2026/TEST',
        projectName: 'Unified Test Project',
        otp: '112233'
    };

    const event = 'OTP';

    console.log(`Sending ${event} to:`, user.email, user.phone);

    // Pass user object directly thanks to my change
    const result = await notificationService.send(user, event, data);

    console.log("Result:", result);
}

testUnified();
