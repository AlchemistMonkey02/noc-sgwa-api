
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected");

        const NOCApplication = mongoose.model('NOCApplication', new mongoose.Schema({
            userId: mongoose.Schema.Types.ObjectId,
            status: String,
            applicationNumber: String
        }), 'noc_applications');

        const apps = await NOCApplication.find({});
        console.log("All Applications:");
        apps.forEach(app => {
            console.log(`- ID: ${app._id}, UserID: ${app.userId}, Status: ${app.status}, App#: ${app.applicationNumber}, UserID Type: ${typeof app.userId} (${app.userId instanceof mongoose.Types.ObjectId ? 'ObjectId' : 'not ObjectId'})`);
        });

        // Test the aggregation count logic
        const users = [...new Set(apps.map(a => a.userId?.toString()).filter(Boolean))];
        for (const uId of users) {
            const stats = await NOCApplication.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(uId) } },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]);
            console.log(`Stats for user ${uId}:`, JSON.stringify(stats));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
