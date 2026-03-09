
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected");

        const NOCApplication = mongoose.model('NOCApplication', new mongoose.Schema({}, { strict: false }), 'nocapplications');
        const apps = await NOCApplication.find({ status: 'PENDING_FINAL_APPROVAL' });
        console.log(`Found ${apps.length} PENDING_FINAL_APPROVAL apps`);

        apps.forEach(app => {
            console.log(`\nAppID: ${app._id}`);
            console.log(`Location:`, JSON.stringify(app.location));
            console.log(`ProjectDetails:`, JSON.stringify(app.projectDetails));
            console.log(`WaterRequirement:`, JSON.stringify(app.waterRequirement));
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
