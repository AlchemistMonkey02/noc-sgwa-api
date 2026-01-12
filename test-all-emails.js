require('dotenv').config();
const emailService = require('./app/utils/email.service');

async function testAllEmails() {
    console.log("Testing ALL Email Templates...");

    const user = {
        email: 'alwanivinod10@gmail.com',
        firstName: 'Vinod',
        username: 'alwanivinod'
    };

    const dummyData = {
        applicationNumber: 'NOC/2026/001',
        projectName: 'Grand Hotel Project',
        remarks: 'Please upload the missing borewell site map.',
        otp: '123456',
        inspectionDate: new Date('2026-02-15'),
        message: 'This is a test message.'
    };

    const events = [
        'OTP',
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
        console.log(`Sending ${event}...`);
        try {
            const result = await emailService.sendNotification(event, user, dummyData);
            if (result.success) console.log(`✅ ${event} sent.`);
            else console.log(`❌ ${event} failed:`, result);
        } catch (e) {
            console.error(`❌ ${event} error:`, e);
        }
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));
    }
}

testAllEmails();
