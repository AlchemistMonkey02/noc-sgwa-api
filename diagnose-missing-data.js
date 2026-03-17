require('dotenv').config();
const mongoose = require('mongoose');
const NOCApplication = require('./app/noc/noc-application.model');

async function diagnose() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const appNumbers = ['Noc/2026/1303/Noc0009', 'EXP-1772689097676'];
    
    for (const num of appNumbers) {
        console.log(`\n=== Diagnosing ${num} ===`);
        const app = await NOCApplication.findOne({ 
            $or: [
                { applicationNumber: num },
                { trackingId: num }
            ]
        }).lean();
        
        if (!app) {
            console.log('Application not found!');
            continue;
        }

        console.log('JSON Structure:');
        console.log(JSON.stringify(app, null, 2));
    }

    await mongoose.disconnect();
}

diagnose().catch(console.error);
