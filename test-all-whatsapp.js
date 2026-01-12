require('dotenv').config();
// Force enable for testing
process.env.WHATSAPP_ENABLED = 'true';
process.env.WHATSAPP_PROVIDER = 'twilio';

const whatsappService = require('./app/notifications/whatsapp.service');

async function testAllWhatsApp() {
    console.log("Testing ALL WhatsApp Templates...");
    console.log("Provider:", whatsappService.provider);

    // Explicitly enable service
    whatsappService.enabled = true;
    whatsappService.provider = 'twilio';

    // Mock user
    const user = {
        phone: '919549549963',
        firstName: 'Vinod',
        username: 'alwanivinod'
    };

    const dummyData = {
        applicationNumber: 'NOC/2026/001',
        projectName: 'Grand Hotel Project',
        remarks: 'Please upload the missing borewell site map.',
        otp: '123456',
        deadline: '20-Feb-2026',
        validity: '3 Years'
    };

    const events = [
        'USER_REGISTERED',
        'OTP',
        'LOGIN',
        'APPLICATION_SUBMITTED',
        'DGO_APPROVED',
        'DGO_REJECTED',
        'DGO_QUERY_RAISED',
        'SGWA_APPROVED',
        'SGWA_REJECTED',
        'SGWA_QUERY_RAISED',
        'INSPECTION_SCHEDULED',
        'NOC_ISSUED',
        'ENFORCEMENT_REJECTED'
    ];

    for (const event of events) {
        console.log(`\n--- Sending ${event} ---`);
        try {
            const dataWithUser = { ...dummyData, user, event };
            const result = await whatsappService.sendNotification(dataWithUser);

            if (result.success) {
                console.log(`✅ ${event} sent successfully. SID: ${result.sid || result.sentCount}`);
            } else {
                console.log(`❌ ${event} failed: ${result.reason || result.error}`);
            }
        } catch (e) {
            console.error(`❌ ${event} exception:`, e.message);
        }
        await new Promise(r => setTimeout(r, 500));
    }
}

testAllWhatsApp();
