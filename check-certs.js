
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected");

        const NOCCertificate = mongoose.model('NOCCertificate', new mongoose.Schema({}, { strict: false }), 'noccertificates');
        const certs = await NOCCertificate.find({});
        console.log("Certificates:");
        certs.forEach(c => {
            console.log(`- ID: ${c._id}, nocId: ${c.nocId}, nocNumber: ${c.nocNumber}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
