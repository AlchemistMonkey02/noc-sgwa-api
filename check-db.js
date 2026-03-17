const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Required to register schemas
require('./app/noc/noc-application.model');
const Inspection = require('./app/officers/inspection/inspection.model');
const User = require('./app/auth/user.model');

dotenv.config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const officer = await User.findOne({ userType: 'INSPECTION' });
        if (!officer) {
            console.log('No inspector found');
            return;
        }
        process.stdout.write(`Officer ID: ${officer._id}\n`);

        const inspections = await Inspection.find({ officerId: officer._id }).populate('applicationId');
        process.stdout.write(`Found ${inspections.length} inspections:\n`);
        inspections.forEach(ins => {
            process.stdout.write(`- ID: ${ins.inspectionId}, Status: ${ins.status}, Date: ${ins.scheduledDate}, App: ${ins.applicationId?.applicationNumber}\n`);
        });

        const now = new Date();
        const start = new Date(now); start.setHours(0,0,0,0);
        const end = new Date(now); end.setHours(23,59,59,999);
        const todayCount = await Inspection.countDocuments({
            officerId: officer._id,
            scheduledDate: { $gte: start, $lte: end }
        });
        process.stdout.write(`Today Count: ${todayCount}\n`);

    } catch (e) { process.stderr.write(e.stack + '\n'); }
    finally { mongoose.disconnect(); }
}
checkData();
