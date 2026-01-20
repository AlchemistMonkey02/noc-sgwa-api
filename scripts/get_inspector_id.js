const mongoose = require('mongoose');
const User = require('../app/auth/user.model');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sgwa_db';
        console.log(`Connecting to: ${uri}`);
        await mongoose.connect(uri);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};

const findOrCreateInspector = async () => {
    await connectDB();

    try {
        // Try to find an existing ENFORCEMENT officer
        let inspector = await User.findOne({ userType: 'ENFORCEMENT' });

        if (inspector) {
            console.log('--------------------------------------------------');
            console.log(`FOUND EXISTING INSPECTOR:`);
            console.log(`ID: ${inspector._id}`);
            console.log(`Name: ${inspector.firstName} ${inspector.lastName}`);
            console.log(`Email: ${inspector.email}`);
            console.log('--------------------------------------------------');
        } else {
            console.log('No Enforcement officer found. Creating one...');

            inspector = await User.create({
                firstName: 'Inspector',
                lastName: 'Officer',
                email: 'inspector@sgwa.gov.in',
                phone: '9876543210',
                password: 'password123', // In a real app, hash this
                userType: 'ENFORCEMENT',
                title: 'Mr',
                gender: 'MALE',
                idProofType: 'PAN',
                idProofNumber: 'ABCDE1234F',
                communicationAddress: {
                    addressLine1: 'Enforcement Wing',
                    state: 'Rajasthan',
                    district: 'Jaipur',
                    pincode: '302001'
                }
            });

            console.log('--------------------------------------------------');
            console.log(`CREATED NEW INSPECTOR:`);
            console.log(`ID: ${inspector._id}`);
            console.log('--------------------------------------------------');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

findOrCreateInspector();
