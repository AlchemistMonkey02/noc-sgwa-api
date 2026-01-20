const mongoose = require('mongoose');
const User = require('../app/auth/user.model');
require('dotenv').config();

const listOfficers = async () => {
    try {
        // Use the verified Atlas URI
        const uri = 'mongodb+srv://nocadmin:admin@cluster0.vonp3t0.mongodb.net/sgwa_db?appName=Cluster0';
        console.log(`Connecting to MongoDB Atlas to fetch officers...`);

        await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
        console.log('✓ Connected. Fetching "INSPECTION_OFFICER" and "ENFORCEMENT" roles...\n');

        const officers = await User.find({
            userType: { $in: ["INSPECTION_OFFICER", "ENFORCEMENT"] }
        }).select("firstName lastName email phone userType username").lean();

        if (officers.length === 0) {
            console.log("No officers found.");
        } else {
            console.log("----------------------------------------------------------------");
            console.log(String("ID").padEnd(30) + String("USERNAME").padEnd(25) + String("ROLE").padEnd(20));
            console.log("----------------------------------------------------------------");
            officers.forEach(off => {
                console.log(
                    String(off._id).padEnd(30) +
                    String(off.username).padEnd(25) +
                    String(off.userType).padEnd(20)
                );
            });
            console.log("----------------------------------------------------------------");
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

listOfficers();
