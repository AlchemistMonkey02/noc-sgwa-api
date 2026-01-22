require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('../app/config/db.config');
const NOCCertificate = require('../app/noc/noc-certificate.model');
const NOCApplication = require('../app/noc/noc-application.model');

async function testDownloadLogic() {
    try {
        await mongoose.connect(dbConfig.url);

        const appIdString = "696385af85ba8d751b6f1d3a"; // The app ID
        const userIdString = "6964cfabefac9d7b41a3edfa"; // The applicant ID

        console.log(`Testing getCertificate logic for App: ${appIdString} and User: ${userIdString}`);

        // Replicating getCertificate logic
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(appIdString);
        console.log("Is ObjectId:", isObjectId);

        const query = { userId: userIdString };
        if (isObjectId) {
            query._id = appIdString;
        } else {
            query.applicationId = appIdString;
            console.log("Is NOT ObjectId, searching by applicationId field");
        }

        console.log("Query:", JSON.stringify(query));

        const application = await NOCApplication.findOne(query);

        if (!application) {
            console.log("ERROR: Application NOT FOUND with this query.");
            // Debug: try finding by ID only
            const appById = await NOCApplication.findById(appIdString);
            if (appById) {
                console.log("Found by ID only. Owner is:", appById.userId);
                console.log("Mismatch?", appById.userId.toString() !== userIdString);
            } else {
                console.log("Not found by ID either.");
            }
        } else {
            console.log("SUCCESS: Application found.");
            if (!application.nocCertificateId) {
                console.log("Certificate ID missing on application.");
            } else {
                console.log("Certificate ID is present:", application.nocCertificateId);
                const cert = await NOCCertificate.findById(application.nocCertificateId);
                if (cert) {
                    console.log("Certificate found. PDF Path:", cert.certificatePDF);
                } else {
                    console.log("Certificate record NOT found.");
                }
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

testDownloadLogic();
