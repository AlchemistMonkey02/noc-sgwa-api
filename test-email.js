require('dotenv').config();
const emailService = require('./app/utils/email.service');

async function testEmail() {
    console.log("Testing Email Service...");
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`Port: ${process.env.SMTP_PORT}`);
    console.log(`User: ${process.env.SMTP_USER}`);

    const user = {
        email: 'alwanivinod10@gmail.com',
        firstName: 'Vinod',
        username: 'alwanivinod'
    };

    try {
        // Test generic email
        const result = await emailService.sendGenericEmail(user, 'Test Email from SGWA', {
            message: 'This is a test email from the SGWA API to verify SMTP configuration.'
        });

        if (result.success) {
            console.log("✅ Email sent successfully!", result);
        } else {
            console.error("❌ Email failed:", result);
        }
    } catch (error) {
        console.error("❌ Exception:", error);
    }
}

testEmail();
