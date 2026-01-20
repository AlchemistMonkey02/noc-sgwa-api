const mongoose = require('mongoose');
const User = require('../app/auth/user.model');
require('dotenv').config();

const createInspector = async () => {
    try {
        // Use the Atlas URI from .env with explicit DB name
        const uri = 'mongodb+srv://nocadmin:admin@cluster0.vonp3t0.mongodb.net/sgwa_db?appName=Cluster0';
        console.log(`Connecting to MongoDB Atlas...`);

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000 // Increase timeout for remote
        });
        console.log('✓ MongoDB Connected');

        // Create the user object
        // NOTE: We are using the User model from local disk, which I just updated 
        // to include 'INSPECTION_OFFICER' in the enum.

        const rand = Math.floor(Math.random() * 10000);
        const username = `inspector_direct_${rand}`;

        const inspectorData = {
            firstName: "Direct",
            lastName: "Inspector",
            email: `inspector_direct_${rand}@sgwa.gov.in`, // Changed to matches schema email field (not emailId)
            phone: `9${rand.toString().padStart(9, '0')}`,
            title: "Dr",
            gender: "MALE",
            uidNumber: `88881234${rand}`,
            idProofType: "PAN",
            idProofNumber: `INSPD${rand}Z`,
            // Address structure matching schema
            communicationAddress: {
                addressLine1: "Direct Insert Wing",
                state: "Rajasthan",
                district: "Jaipur",
                pincode: "302002"
            },
            username: username,
            password: "password123", // Note: In real app this should be hashed, but schema doesn't enforce hashing, controller does. 
            // If User model has pre-save hook for hashing, it will run here!
            userType: "INSPECTION_OFFICER",
            verificationStatus: "VERIFIED",
            accountStatus: "ACTIVE",
            emailVerified: true,
            phoneVerified: true
        };

        console.log(`Creating user with role: ${inspectorData.userType}...`);

        const user = new User(inspectorData);
        await user.save();

        console.log('\nSUCCESS! Created Inspection Officer directly in DB:');
        console.log(`ID: ${user._id}`);
        console.log(`Username: ${user.username}`);
        console.log(`Role: ${user.userType}`);

    } catch (error) {
        console.error('Error creating inspector:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

createInspector();
