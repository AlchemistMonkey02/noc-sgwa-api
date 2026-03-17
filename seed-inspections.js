const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const Inspection = require('./app/officers/inspection/inspection.model');
const NOCApplication = require('./app/noc/noc-application.model');
const User = require('./app/auth/user.model');

dotenv.config();

async function seedInspections() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find the inspector
        const officer = await User.findOne({ userType: 'INSPECTION' });
        if (!officer) {
            console.error('No inspection officer found.');
            return;
        }

        // Clean existing
        await Inspection.deleteMany({ officerId: officer._id });
        console.log('Cleaned existing inspections');

        // 2. Find applications
        const applications = await NOCApplication.find({
            status: { $in: ['SUBMITTED', 'APPROVED_DGO', 'APPROVED_SGWA'] }
        }).limit(6);

        // 3. Create Inspections
        const statuses = ['SCHEDULED', 'SCHEDULED', 'SCHEDULED', 'COMPLETED', 'SCHEDULED'];
        const dates = [
            new Date(), // Today
            new Date(Date.now() + 86400000), // Tomorrow
            new Date(Date.now() - 86400000), // Yesterday
            new Date(Date.now() - 172800000), // 2 days ago
            new Date() // Today
        ];
        const priorities = ['HIGH', 'MEDIUM', 'LOW', 'MEDIUM', 'HIGH'];

        for (let i = 0; i < applications.length; i++) {
            const app = applications[i];
            const inspection = new Inspection({
                inspectionId: uuidv4(),
                applicationId: app._id,
                officerId: officer._id,
                status: statuses[i % statuses.length],
                scheduledDate: dates[i % dates.length],
                priority: priorities[i % priorities.length]
            });
            await inspection.save();
            console.log(`Seeded ${inspection.inspectionId} (${inspection.priority}) for ${app.applicationNumber}`);
        }
    } catch (error) { console.error(error); }
    finally { await mongoose.disconnect(); }
}
seedInspections();
