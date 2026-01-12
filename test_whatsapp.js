require('dotenv').config();
const whatsappService = require('./app/notifications/whatsapp.service');
// Force enable for testing
whatsappService.enabled = true;

async function testWhatsApp() {
    console.log("Testing WhatsApp Service...");

    const testData = {
        event: 'USER_REGISTERED', // Should trigger the template logic
        user: {
            phone: '9549549963' // User's provided number
        },
        applicationNumber: 'TEST-123',
        otp: '123456'
    };

    try {
        const result = await whatsappService.sendNotification(testData);
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testWhatsApp();
