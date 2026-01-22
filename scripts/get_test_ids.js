require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('../app/config/db.config');

const NOCApplication = require('../app/noc/noc-application.model');
const NOCCertificate = require('../app/noc/noc-certificate.model');
const User = require('../app/auth/user.model');

async function getIds() {
    try {
        await mongoose.connect(dbConfig.url);
        console.log("Connected to DB");

        // 1. Try to find an Issued Application
        let app = await NOCApplication.findOne({ status: 'NOC_ISSUED' });

        let type = "ISSUED";
        if (!app) {
            console.log("No ISSUED application found. looking for any application...");
            app = await NOCApplication.findOne();
            type = app ? "ANY_DRAFT/SUBMITTED" : "NONE";
        }

        if (app) {
            console.log("\n--- TEST DATA ---");
            console.log(`Type: ${type}`);
            console.log(`Application ID (_id): ${app._id}`);
            console.log(`Application Number: ${app.applicationNumber || 'N/A'}`);
            console.log(`Tracking ID: ${app.trackingId || 'N/A'}`);
            console.log(`User ID: ${app.userId}`);

            // Check for certificate
            if (app.nocCertificateId) {
                console.log(`Certificate ID: ${app.nocCertificateId}`);
            }

            // Find user details for login context
            const user = await User.findById(app.userId);
            if (user) {
                console.log(`Owner Email (for login): ${user.email}`);
            }
        } else {
            console.log("No applications found in the database.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

getIds();
