require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('../app/config/db.config');
const User = require('../app/auth/user.model');
const NOCApplication = require('../app/noc/noc-application.model');

async function getUserCreds() {
    try {
        await mongoose.connect(dbConfig.url);

        console.log("Connected. Searching for any APPLICANT...");

        // Find any user with userType 'APPLICANT' or role 'APPLICANT' (based on schema)
        // Schema uses 'userType' enum ["APPLICANT", ...]
        const user = await User.findOne({ userType: 'APPLICANT' });

        if (user) {
            console.log("\n--- VALID APPLICANT FOUND ---");
            console.log(`User ID: ${user._id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Username: ${user.username || 'N/A'}`);
            console.log(`First Name: ${user.firstName}`);

            // Check if this user has any applications
            const apps = await NOCApplication.find({ userId: user._id });
            console.log(`Has ${apps.length} applications.`);

            if (apps.length > 0) {
                console.log(`Sample App ID: ${apps[0]._id}`);
                console.log(`Sample Tracking ID: ${apps[0].trackingId}`);
                if (apps[0].status === 'NOC_ISSUED') {
                    console.log("User has an ISSUED NOC.");
                }
            }
        } else {
            console.log("No APPLICANT users found in the database.");

            // Fallback: List ANY user
            const anyUser = await User.findOne();
            if (anyUser) {
                console.log(`Found a user of type: ${anyUser.userType}`);
                console.log(`Email: ${anyUser.email}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

getUserCreds();
