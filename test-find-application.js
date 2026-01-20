// Test script to find application by tracking ID
require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('./app/config/db.config');

async function testFindApplication() {
    try {
        await mongoose.connect(dbConfig.url);
        console.log('Connected to MongoDB\n');

        const NOCApplication = require('./app/noc/noc-application.model');

        // Test 1: Find by tracking ID
        console.log('=== Test 1: Find by Tracking ID ===');
        const trackingId = 'REF-20260110-6106';
        const byTracking = await NOCApplication.findOne({ trackingId });

        if (byTracking) {
            console.log('✓ Found by tracking ID:');
            console.log('  - Application ID:', byTracking.applicationId);
            console.log('  - Application Number:', byTracking.applicationNumber);
            console.log('  - Tracking ID:', byTracking.trackingId);
            console.log('  - Status:', byTracking.status);
            console.log('  - District:', byTracking.location?.district || 'N/A');
            console.log('  - MongoDB _id:', byTracking._id);
        } else {
            console.log('✗ NOT FOUND by tracking ID:', trackingId);
        }

        // Test 2: Find by application ID
        console.log('\n=== Test 2: Find by Application ID ===');
        const appId = '5a2646fa-324f-45dc-88b8-5097e03d3b85';
        const byAppId = await NOCApplication.findOne({ applicationId: appId });

        if (byAppId) {
            console.log('✓ Found by application ID:');
            console.log('  - Tracking ID:', byAppId.trackingId);
            console.log('  - Status:', byAppId.status);
        } else {
            console.log('✗ NOT FOUND by application ID:', appId);
        }

        // Test 3: List all applications
        console.log('\n=== Test 3: All Applications ===');
        const allApps = await NOCApplication.find().limit(5);
        console.log(`Total applications found: ${allApps.length}`);

        allApps.forEach((app, index) => {
            console.log(`\n${index + 1}.`);
            console.log('   Application ID:', app.applicationId);
            console.log('   Tracking ID:', app.trackingId);
            console.log('   Application Number:', app.applicationNumber);
            console.log('   Status:', app.status);
            console.log('   District:', app.location?.district || 'N/A');
        });

        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testFindApplication();
