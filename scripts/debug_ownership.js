require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('../app/config/db.config');
const User = require('../app/auth/user.model');
const NOCApplication = require('../app/noc/noc-application.model');

async function debugOwnership() {
    try {
        await mongoose.connect(dbConfig.url);

        console.log("--- DEBUGGING OWNERSHIP ---");

        // 1. Get the Applicant User
        const username = "applicant_test";
        const user = await User.findOne({ username });

        if (!user) {
            console.log(`CRITICAL: User '${username}' NOT FOUND!`);
            return;
        }

        console.log(`User '${username}' found.`);
        console.log(`User ID (Object): ${user._id}`);
        console.log(`User ID (String): ${user._id.toString()}`);

        // 2. Get the Application
        const appId = "696385af85ba8d751b6f1d3a";
        const app = await NOCApplication.findById(appId);

        if (!app) {
            console.log(`CRITICAL: Application '${appId}' NOT FOUND!`);
            return;
        }

        console.log(`Application found.`);
        console.log(`App Owner ID (Object): ${app.userId}`);
        console.log(`App Owner ID (String): ${app.userId.toString()}`);

        // 3. Compare
        const match = user._id.toString() === app.userId.toString();
        console.log(`Ownership Match: ${match}`);

        if (!match) {
            console.log("MISMATCH DETECTED!");
            console.log("Linking App to Correct User...");
            app.userId = user._id;
            await app.save();
            console.log("FIXED: Application re-linked to user.");
        } else {
            console.log("Ownership is CORRECT.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

debugOwnership();
