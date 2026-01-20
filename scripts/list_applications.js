const mongoose = require('mongoose');
require('dotenv').config();

const NOCApplicationSchema = new mongoose.Schema({
    applicationId: String,
    applicationNumber: String,
    status: String,
    createdAt: Date
}, { strict: false });

const NOCApplication = mongoose.model('NOCApplication', NOCApplicationSchema);

const listApps = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB.");

        const apps = await NOCApplication.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("applicationId applicationNumber status")
            .lean();

        if (apps.length === 0) {
            console.log("No applications found in DB.");
        } else {
            console.log("--------------------------------------------------");
            console.log(String("APP ID").padEnd(25) + String("NUMBER").padEnd(25) + String("STATUS"));
            console.log("--------------------------------------------------");
            apps.forEach(a => {
                console.log(
                    String(a.applicationId).padEnd(25) +
                    String(a.applicationNumber).padEnd(25) +
                    String(a.status)
                );
            });
        }
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

listApps();
