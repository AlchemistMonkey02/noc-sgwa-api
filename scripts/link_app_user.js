require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('../app/config/db.config');
const NOCApplication = require('../app/noc/noc-application.model');

async function linkApp() {
    try {
        await mongoose.connect(dbConfig.url);

        const appId = "696385af85ba8d751b6f1d3a"; // The issued app
        const userId = "6964cfabefac9d7b41a3edfa"; // applicant@test.com

        const app = await NOCApplication.findByIdAndUpdate(
            appId,
            { userId: userId },
            { new: true }
        );

        if (app) {
            console.log("Successfully linked application to applicant@test.com");
            console.log(`App ID: ${app._id}`);
            console.log(`New Owner: ${app.userId}`);
        } else {
            console.log("Application not found to update.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

linkApp();
