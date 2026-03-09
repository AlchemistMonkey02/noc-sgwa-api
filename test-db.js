const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const User = require('./app/auth/user.model');
        const NOCApplication = require('./app/noc/noc-application.model');

        const officer = await User.findOne({ userType: 'DGO' });
        console.log("DGO Officer:", officer ? officer.email : "None", "District:", officer?.communicationAddress?.district);

        const apps = await NOCApplication.find().limit(5);
        console.log("Sample Applications (Districts):", apps.map(a => a.location?.districtId));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
