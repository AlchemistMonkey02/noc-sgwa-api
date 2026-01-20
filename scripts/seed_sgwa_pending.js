const mongoose = require('mongoose');
require('dotenv').config();

const NOCApplicationSchema = new mongoose.Schema({
    applicationId: String,
    applicationNumber: String,
    status: String,
    approvalFlow: {
        dgo: Object,
        sgwa: Object
    }
}, { strict: false });

const NOCApplication = mongoose.model('NOCApplication', NOCApplicationSchema);

const seedSgwaPending = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB.");

        // Find the most recent application
        const app = await NOCApplication.findOne().sort({ createdAt: -1 });

        if (!app) {
            console.log("No applications found to update.");
            return;
        }

        console.log(`Found Application: ${app.applicationNumber} (Current Status: ${app.status})`);

        // Force update to APPROVED_DGO (Pending SGWA)
        app.status = "APPROVED_DGO";
        if (!app.approvalFlow) app.approvalFlow = {};

        // Mock DGO Approval details if missing
        app.approvalFlow.dgo = {
            status: "APPROVED",
            recommendation: "RECOMMEND_APPROVAL",
            reviewedAt: new Date(),
            reviewedBy: "DGO_MANUAL_SEED",
            remarks: "Manually seeded for SGWA testing"
        };
        // Clear SGWA status if any
        if (app.approvalFlow.sgwa) delete app.approvalFlow.sgwa;

        await app.save();
        console.log(`\nSUCCESS! Updated ${app.applicationNumber} to 'APPROVED_DGO'.`);
        console.log("You can now fetch it via the SGWA API.");

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

seedSgwaPending();
