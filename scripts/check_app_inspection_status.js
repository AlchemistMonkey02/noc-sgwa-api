const mongoose = require('mongoose');
require('dotenv').config();

// Minimal Schema to access approvalFlow
const NOCApplicationSchema = new mongoose.Schema({
    applicationId: String,
    applicationNumber: String,
    status: String,
    approvalFlow: {
        dgo: {
            status: String,
            inspectionDetails: Object, // We want to see if this exists
            verificationDetails: Object
        }
    }
}, { strict: false });

const NOCApplication = mongoose.model('NOCApplication', NOCApplicationSchema);

const checkStatus = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log("Connected to DB.");

        const appId = "REF-20260110-6106";
        const app = await NOCApplication.findOne({
            $or: [{ applicationId: appId }, { applicationNumber: appId }]
        });

        if (!app) {
            console.log("Application NOT FOUND.");
        } else {
            console.log(`Application Found: ${app.applicationId}`);
            console.log(`Current Status: ${app.status}`);

            const dgoFlow = app.approvalFlow?.dgo || {};
            console.log("DGO Flow Status:", dgoFlow.status);

            if (dgoFlow.inspectionDetails) {
                console.log("Inspection Details: FOUND");
                console.log(JSON.stringify(dgoFlow.inspectionDetails, null, 2));
            } else {
                console.log("Inspection Details: MISSING (Report not submitted yet)");
            }
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

checkStatus();
