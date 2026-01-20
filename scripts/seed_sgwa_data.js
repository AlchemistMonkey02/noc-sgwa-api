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

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB.");

        // fetch 2 legit apps
        const apps = await NOCApplication.find().sort({ createdAt: -1 }).limit(2);

        if (apps.length < 2) {
            console.log("Need at least 2 apps in DB to seed distinct test cases. Please create more apps first.");
            // Fallback: update whatever we have
        }

        if (apps[0]) {
            // Case 1: PENDING_SGWA_REVIEW (Should show in Technical Review AND Pending)
            apps[0].status = "PENDING_SGWA_REVIEW";
            if (!apps[0].approvalFlow) apps[0].approvalFlow = {};
            apps[0].approvalFlow.dgo = { status: "APPROVED", recommendation: "RECOMMEND_APPROVAL", reviewedBy: "DGO_TEST" };
            await apps[0].save();
            console.log(`Updated ${apps[0].applicationNumber} to 'PENDING_SGWA_REVIEW' (For Technical Review API)`);
        }

        if (apps[1]) {
            // Case 2: APPROVED_DGO (Should show in Pending only)
            apps[1].status = "APPROVED_DGO";
            if (!apps[1].approvalFlow) apps[1].approvalFlow = {};
            apps[1].approvalFlow.dgo = { status: "APPROVED", recommendation: "RECOMMEND_APPROVAL", reviewedBy: "DGO_TEST" };
            await apps[1].save();
            console.log(`Updated ${apps[1].applicationNumber} to 'APPROVED_DGO' (For Pending API)`);
        }

        console.log("\nData seeded successfully.");

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

seedData();
