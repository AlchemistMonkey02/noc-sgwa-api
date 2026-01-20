const mongoose = require('mongoose');
const User = require('../app/auth/user.model');
require('dotenv').config();

const seedServerDB = async () => {
    try {
        // Use the EXACT URI from .env (which server uses)
        // This is likely 'mongodb+srv://.../?appName=Cluster0' (defaults to 'test' db)
        const uri = process.env.MONGODB_URI;

        console.log(`Connecting to Server's DB URI: ${uri}`);

        await mongoose.connect(uri);
        console.log('✓ Connected to Server DB.');

        // 1. Check if we have any inspection officers
        const existing = await User.find({ userType: "INSPECTION_OFFICER" });
        console.log(`Found ${existing.length} existing Inspection Officers.`);

        if (existing.length > 0) {
            console.log("Data already exists:");
            console.log(existing.map(u => `${u._id} - ${u.username}`));
        } else {
            console.log("No officers found. Creating one now...");

            const rand = Math.floor(Math.random() * 1000);
            const user = new User({
                firstName: "Server",
                lastName: "Inspector",
                email: `inspector_server_${rand}@sgwa.gov.in`,
                phone: `91${rand.toString().padStart(8, '0')}`,
                title: "Mr",
                gender: "MALE",
                uidNumber: `7777${rand}1234`,
                idProofType: "PAN",
                idProofNumber: `SERV${rand}Z`,
                communicationAddress: {
                    addressLine1: "Server DB Wing",
                    state: "Rajasthan",
                    district: "Jaipur",
                    pincode: "302005"
                },
                username: `inspector_server_${rand}`,
                password: "password123",
                userType: "INSPECTION_OFFICER",
                verificationStatus: "VERIFIED",
                accountStatus: "ACTIVE",
                emailVerified: true,
                phoneVerified: true
            });

            await user.save();
            console.log("\nSUCCESS! Created verified officer in Server DB:");
            console.log(`ID: ${user._id}`);
            console.log(`Username: ${user.username}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

seedServerDB();
