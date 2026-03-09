require('dotenv').config();
const mongoose = require('mongoose');
const NOCApplication = require('./app/noc/noc-application.model');
const User = require('./app/auth/user.model');

async function checkSGWA() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // 1. Check what statuses exist
    console.log('=== All Application Statuses ===');
    const statusCounts = await NOCApplication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    statusCounts.forEach(s => console.log(`  ${s._id}: ${s.count}`));

    // 2. Check SGWA-visible statuses
    const sgwaStatuses = ["APPROVED_DGO", "PENDING_SGWA_REVIEW", "UNDER_REVIEW_SGWA", "QUERY_RAISED_SGWA", "QUERY_RESPONDED"];
    const sgwaApps = await NOCApplication.countDocuments({ status: { $in: sgwaStatuses } });
    console.log(`\n=== SGWA-visible applications: ${sgwaApps} ===`);

    // 3. Check the SGWA user account
    console.log('\n=== SGWA Users ===');
    const sgwaUsers = await User.find({ userType: 'SGWA' }).select('firstName lastName email userType communicationAddress');
    if (sgwaUsers.length === 0) {
        console.log('  NO SGWA USERS FOUND! The SGWA login user might not have userType=SGWA in the DB');
    } else {
        sgwaUsers.forEach(u => console.log(`  ${u.firstName} ${u.lastName} | ${u.email} | type: ${u.userType}`));
    }

    // 4. Check if the route is registered correctly by looking at the officer routes
    console.log('\n=== Route check: /officer/sgwa/dashboard ===');
    console.log('  Route exists in sgwa.routes.js - check if backend server is running latest code');
    console.log('  Please restart the backend server (sgwa-api) if you haven\'t done so after the fix');

    await mongoose.disconnect();
}

checkSGWA().catch(console.error);
