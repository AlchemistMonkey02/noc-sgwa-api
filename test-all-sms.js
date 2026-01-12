require('dotenv').config();
// Set Twilio Credentials for Testing
process.env.SMS_ENABLED = 'true';
process.env.SMS_PROVIDER = 'twilio';
process.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || ''; // Assumed from context
process.env.TWILIO_PHONE_NUMBER = '+18148592426';

const smsService = require('./app/notifications/sms.service');

async function testAllSMS() {
    console.log("Testing ALL SMS Templates...");
    console.log("Provider:", smsService.provider);

    // Explicitly enable and configure
    smsService.enabled = true;
    smsService.provider = 'twilio';

    // Target User
    const user = {
        phone: '917300359061', // User provided target
        firstName: 'Vinod',
        username: 'alwanivinod'
    };

    const dummyData = {
        applicationNumber: 'NOC/2026/001',
        projectName: 'Grand Hotel Project',
        remarks: 'Please check query.',
        otp: '998877',
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
            const result = await smsService.sendNotification(dataWithUser);

            if (result.success) {
                console.log(`✅ ${event} sent successfully.`);
            } else {
                console.log(`❌ ${event} failed: ${result.reason || result.error}`);
            }
        } catch (e) {
            console.error(`❌ ${event} exception:`, e.message);
        }
        // Small delay
        await new Promise(r => setTimeout(r, 1000));
    }
}

testAllSMS();
