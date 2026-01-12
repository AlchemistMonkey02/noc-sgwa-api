require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./app/auth/user.model');
const dbConfig = require('./app/config/db.config');

const createApplicant = async () => {
    try {
        await mongoose.connect(dbConfig.url);
        console.log('Connected to MongoDB');

        const applicantData = {
            email: 'applicant@test.com',
            username: 'applicant_test',
            phone: '9876543200', // Unique phone (different from officers)
            password: 'Password@123',
            userType: 'APPLICANT',
            title: 'Mr',
            firstName: 'Test',
            lastName: 'Applicant',
            gender: 'MALE',
            idProofType: 'AADHAAR',
            idProofNumber: '123412341234',
            communicationAddress: {
                addressLine1: 'Test Address',
                state: 'Rajasthan',
                district: 'Jaipur',
                pincode: '302001'
            },
            accountStatus: 'ACTIVE',
            emailVerified: true,
            phoneVerified: true,
            verificationStatus: 'VERIFIED'
        };

        // Check if exists
        const exists = await User.findOne({ $or: [{ email: applicantData.email }, { phone: applicantData.phone }] });
        if (exists) {
            console.log('User already exists. Updating password...');
            exists.password = await bcrypt.hash(applicantData.password, 10);
            await exists.save();
            console.log('User updated.');
        } else {
            console.log('Creating new user...');
            const hashedPassword = await bcrypt.hash(applicantData.password, 10);
            const user = new User({ ...applicantData, password: hashedPassword });
            await user.save();
            console.log('User created.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createApplicant();
