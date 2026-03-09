
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected");

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        const NOCApplication = mongoose.model('NOCApplication', new mongoose.Schema({}, { strict: false }), 'nocapplications');
        const apps = await NOCApplication.find({}).limit(5);
        console.log("Apps in nocapplications:", apps.length);
        if (apps.length > 0) {
            apps.forEach(app => console.log(`- ID: ${app._id}, Status: ${app.status}, UserID: ${app.userId}`));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
