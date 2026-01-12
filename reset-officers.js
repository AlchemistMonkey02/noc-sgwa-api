require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./app/auth/user.model');
const dbConfig = require('./app/config/db.config');

const resetOfficers = async () => {
    try {
        await mongoose.connect(dbConfig.url);
        console.log('Connected to MongoDB');

        const emails = [
            'dgo.officer@rajasthan.gov.in',
            'sgwa.officer@rajasthan.gov.in',
            'enforcement.officer@rajasthan.gov.in'
        ];

        const phones = ['9876543210', '9876543211', '9876543212'];
        console.log('Deleting existing officers...');
        await User.deleteMany({
            $or: [
                { email: { $in: emails } },
                { phone: { $in: phones } }
            ]
        });
        console.log('Deleted.');

        const officers = [
            {
                email: 'dgo.officer@rajasthan.gov.in',
                username: 'dgo_admin',
                firstName: 'DGO',
                lastName: 'Officer',
                title: 'Mr',
                role: 'DGO',
                phone: '9876543210',
                district: 'Jaipur'
            },
            {
                email: 'sgwa.officer@rajasthan.gov.in',
                username: 'sgwa_admin',
                firstName: 'SGWA',
                lastName: 'Authority',
                title: 'Mr',
                role: 'RSGWA',
                phone: '9876543211',
                district: 'Jaipur'
            },
            {
                email: 'enforcement.officer@rajasthan.gov.in',
                username: 'enforcement_admin',
                firstName: 'Enforcement',
                lastName: 'Officer',
                title: 'Mr',
                role: 'ENFORCEMENT',
                phone: '9876543212',
                district: 'Jaipur'
            }
        ];

        const hashedPassword = await bcrypt.hash('password123', 10);

        for (const officer of officers) {
            const newUser = new User({
                email: officer.email,
                username: officer.username,
                phone: officer.phone,
                password: hashedPassword,
                userType: officer.role, // "RSGWA" matches enum
                title: officer.title,
                firstName: officer.firstName,
                lastName: officer.lastName,
                gender: 'MALE',
                idProofType: 'AADHAAR',
                idProofNumber: '123456789012',
                communicationAddress: {
                    addressLine1: 'Secretariat',
                    state: 'Rajasthan',
                    district: officer.district,
                    pincode: '302005'
                },
                accountStatus: 'ACTIVE',
                emailVerified: true,
                phoneVerified: true,
                verificationStatus: 'VERIFIED'
            });

            await newUser.save();
            console.log(`Created user: ${officer.email} (${officer.role})`);
        }

        console.log('Reset completed.');
        process.exit(0);
    } catch (error) {
        console.error('Reset failed:', error);
        process.exit(1);
    }
};

resetOfficers();
