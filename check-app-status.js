// Quick diagnostic script to check application status in MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const NOCApplication = require('./app/noc/noc-application.model');

async function checkApplicationStatus() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the specific application
    const targetId = '271096db-5929-473a-9e27-5db444611f86';
    const app = await NOCApplication.findOne({
        $or: [
            { applicationId: targetId },
            { _id: mongoose.isValidObjectId(targetId) ? targetId : undefined }
        ]
    }).select('applicationId applicationNumber status submittedAt location trackingId userId');

    if (app) {
        console.log('\n=== Application Found ===');
        console.log('ApplicationId:', app.applicationId);
        console.log('ApplicationNumber:', app.applicationNumber);
        console.log('Status:', app.status);
        console.log('SubmittedAt:', app.submittedAt);
        console.log('TrackingId:', app.trackingId);
        console.log('District:', app.location?.districtId);
        console.log('BlockCategory:', app.location?.blockCategory);
    } else {
        console.log('\n=== Application NOT FOUND ===');
        console.log('Searched for ID:', targetId);
    }

    // Also list all SUBMITTED apps
    const submittedApps = await NOCApplication.find({ status: 'SUBMITTED' })
        .select('applicationId applicationNumber status submittedAt');
    console.log('\n=== All SUBMITTED Applications ===');
    console.log(`Total: ${submittedApps.length}`);
    submittedApps.forEach(a => console.log(` - ${a.applicationId} | ${a.applicationNumber} | submitted: ${a.submittedAt}`));

    // Also list all apps with any status
    const allApps = await NOCApplication.find({})
        .select('applicationId applicationNumber status createdAt')
        .sort({ createdAt: -1 })
        .limit(10);
    console.log('\n=== Last 10 Applications (any status) ===');
    allApps.forEach(a => console.log(` - ${a.applicationId} | ${a.applicationNumber} | status: ${a.status}`));

    await mongoose.disconnect();
}

checkApplicationStatus().catch(console.error);
