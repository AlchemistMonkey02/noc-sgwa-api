require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./app/auth/user.model'); // Adjust path if needed
const dbConfig = require('./app/config/db.config');

const seedOfficers = async () => {
    try {
        await mongoose.connect(dbConfig.url);
        console.log('Connected to MongoDB');

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

        for (const officer of officers) {
            const exists = await User.findOne({
                $or: [{ email: officer.email }, { phone: officer.phone }]
            });
            if (exists) {
                console.log(`User ${officer.email} or phone ${officer.phone} already exists. Skipping.`);
                continue;
            }

            const hashedPassword = await bcrypt.hash('password123', 10);

            const newUser = new User({
                email: officer.email,
                username: officer.username,
                phone: officer.phone,
                password: hashedPassword,
                userType: officer.role,
                title: officer.title,
                firstName: officer.firstName,
                lastName: officer.lastName,
                gender: 'MALE',
                // Mock required fields
                idProofType: 'AADHAAR',
                idProofNumber: '123456789012',
                communicationAddress: {
                    addressLine1: 'Secretariat',
                    state: 'Rajasthan',
                    district: officer.district,
                    pincode: '302005'
                },
                // Default props
                accountStatus: 'ACTIVE',
                emailVerified: true,
                phoneVerified: true,
                verificationStatus: 'VERIFIED'
            });

            await newUser.save();
            console.log(`Created user: ${officer.email} (${officer.role})`);
        }

        console.log('Seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedOfficers();
