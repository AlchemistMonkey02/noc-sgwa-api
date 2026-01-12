const mongoose = require('mongoose');
require('dotenv').config();
const NOCApplication = require('../app/noc/noc-application.model');

async function migrateTrackingIds() {
    try {
        console.log('🌱 Connecting to database...');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sgwa-db');
        }

        console.log('🔍 Finding applications without trackingId...');
        const applications = await NOCApplication.find({
            $or: [
                { trackingId: { $exists: false } },
                { trackingId: null },
                { trackingId: "" }
            ]
        });

        console.log(`Found ${applications.length} applications to update.`);

        for (const app of applications) {
            const datePart = new Date(app.createdAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, "");
            const randomPart = Math.floor(1000 + Math.random() * 9000);
            const newTrackingId = `REF-${datePart}-${randomPart}`;

            app.trackingId = newTrackingId;
            await app.save({ validateBeforeSave: false }); // Skip validation to just update ID
            console.log(`✅ Updated ${app.applicationId} -> ${newTrackingId}`);
        }

        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateTrackingIds();
