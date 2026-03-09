
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected");

        const noc_apps = await mongoose.connection.db.collection('noc_applications').countDocuments();
        const nocapps = await mongoose.connection.db.collection('nocapplications').countDocuments();

        console.log(`noc_applications count: ${noc_apps}`);
        console.log(`nocapplications count: ${nocapps}`);

        const noc_certs = await mongoose.connection.db.collection('noccertificates').countDocuments();
        console.log(`noccertificates count: ${noc_certs}`);

        // Recent apps in BOTH
        const last_noc_apps = await mongoose.connection.db.collection('noc_applications').find({}).sort({ updatedAt: -1 }).limit(2).toArray();
        console.log("\nRecent in noc_applications:");
        last_noc_apps.forEach(a => console.log(`- ${a.applicationNumber} status: ${a.status} updatedAt: ${a.updatedAt}`));

        const last_nocapps = await mongoose.connection.db.collection('nocapplications').find({}).sort({ updatedAt: -1 }).limit(2).toArray();
        console.log("\nRecent in nocapplications:");
        last_nocapps.forEach(a => console.log(`- ${a.applicationNumber} status: ${a.status} updatedAt: ${a.updatedAt}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
