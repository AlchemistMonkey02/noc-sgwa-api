
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected");

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
        const users = await User.find({}).select('_id firstName lastName username email');
        console.log("Users:");
        users.forEach(u => console.log(`- ${u._id}: ${u.firstName} ${u.lastName} (${u.username})`));

        const NOCApplication = mongoose.model('NOCApplication', new mongoose.Schema({}, { strict: false }), 'nocapplications');
        const apps = await NOCApplication.find({});
        console.log("\nApplications in nocapplications:");
        apps.forEach(app => {
            const user = users.find(u => u._id.toString() === app.userId?.toString());
            console.log(`- ID: ${app._id}, Status: ${app.status}, User: ${user ? user.username : 'Unknown (' + app.userId + ')'}, App#: ${app.applicationNumber}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
