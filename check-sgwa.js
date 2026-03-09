require('dotenv').config();
const mongoose = require('mongoose');
const NOCApplication = require('./app/noc/noc-application.model');

async function checkStatuses() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected');

    const counts = await NOCApplication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    console.log('Status counts:');
    counts.forEach(c => console.log(`  ${c._id}: ${c.count}`));

    const sgwaApps = await NOCApplication.find({
        status: { $in: ['APPROVED_DGO', 'PENDING_SGWA_REVIEW', 'UNDER_REVIEW_SGWA'] }
    }).select('applicationId applicationNumber status');
    console.log('\nApplications visible to SGWA:', sgwaApps.length);
    sgwaApps.forEach(a => console.log(`  ${a.applicationId} | ${a.applicationNumber} | ${a.status}`));

    await mongoose.disconnect();
}

checkStatuses().catch(console.error);
