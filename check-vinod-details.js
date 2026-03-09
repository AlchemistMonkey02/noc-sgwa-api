
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected");

        const User = mongoose.model('User', new mongoose.Schema({}), 'users');
        const user = await User.findOne({ username: 'vinodji02' });
        if (!user) {
            console.log("User vinodji02 not found");
            process.exit(1);
        }
        console.log("User ID:", user._id);

        const NOCApplication = mongoose.model('NOCApplication', new mongoose.Schema({}, { strict: false }), 'nocapplications');
        const apps = await NOCApplication.find({ userId: user._id });
        console.log("\nApplications for vinodji02:");
        apps.forEach(app => {
            console.log(`- ID: ${app._id}`);
            console.log(`  App#: ${app.applicationNumber}`);
            console.log(`  Status: ${app.status}`);
            console.log(`  nocCertificateId: ${app.nocCertificateId}`);
            console.log(`  Enforcement Status: ${app.approvalFlow?.enforcement?.status}`);
            console.log(`  NOC Number (Flow): ${app.approvalFlow?.enforcement?.nocNumber}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
