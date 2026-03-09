const mongoose = require("mongoose");
require("dotenv").config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const NOCApplication = mongoose.model("NOCApplication", new mongoose.Schema({
        applicationId: String,
        status: String,
        location: { districtId: String },
        communicationAddress: { district: String },
        projectDetails: { projectName: String }
    }, { strict: false }));

    const apps = await NOCApplication.find({});
    console.log(`Total Applications: ${apps.length}`);

    const statuses = {};
    const districts = {};

    apps.forEach(app => {
        statuses[app.status] = (statuses[app.status] || 0) + 1;
        const dist = app.location?.districtId || app.communicationAddress?.district || 'Unknown';
        districts[dist] = (districts[dist] || 0) + 1;
        console.log(`- ${app.applicationId}: ${app.status} | District: ${dist}`);
    });

    console.log("\nStatuses:", statuses);
    console.log("Districts:", districts);

    process.exit(0);
}

check();
