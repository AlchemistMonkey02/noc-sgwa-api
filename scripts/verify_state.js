require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('../app/config/db.config');
const NOCApplication = require('../app/noc/noc-application.model');

async function verifyAppState() {
    try {
        await mongoose.connect(dbConfig.url);

        const appId = "696385af85ba8d751b6f1d3a";
        const app = await NOCApplication.findById(appId);

        if (app) {
            console.log("--- APP STATE ---");
            console.log(`ID: ${app._id}`);
            console.log(`Owner User ID: ${app.userId}`);
            console.log(`Certificate ID: ${app.nocCertificateId}`);
            console.log(`Status: ${app.status}`);
        } else {
            console.log("Application NOT FOUND by ID.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyAppState();
