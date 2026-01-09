const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const usersSeeder = async () => {
    try {
        console.log('🌱 Seeding Users...');

        // Connect if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sgwa-db');
        }

        const User = require('../app/auth/user.model');
        await User.deleteMany({});

        const password = await bcrypt.hash('Password@123', 10);

        const users = await User.insertMany([
            {
                title: 'Mr',
                firstName: 'Test',
                lastName: 'Applicant',
                email: 'applicant@test.com',
                phone: '9876543210',
                password,
                dateOfBirth: new Date('1990-01-15'),
                gender: 'MALE',
                idProofType: 'AADHAAR',
                idProofNumber: '1234-5678-9012',
                userType: 'APPLICANT',
                communicationAddress: {
                    addressLine1: 'Plot 123, Test Street',
                    state: 'RAJASTHAN',
                    district: 'JAIPUR',
                    pincode: '302001'
                },
                emailVerified: true,
                phoneVerified: true,
                verificationStatus: 'VERIFIED',
                accountStatus: 'ACTIVE'
            },
            {
                title: 'Mr',
                firstName: 'DGO',
                lastName: 'Officer',
                email: 'dgo@test.com',
                phone: '9876543211',
                password,
                dateOfBirth: new Date('1985-05-20'),
                gender: 'MALE',
                idProofType: 'PAN',
                idProofNumber: 'ABCDE1234F',
                userType: 'DGO',
                communicationAddress: {
                    addressLine1: 'Ground Water Office',
                    state: 'RAJASTHAN',
                    district: 'JAIPUR',
                    pincode: '302001'
                },
                emailVerified: true,
                phoneVerified: true,
                verificationStatus: 'VERIFIED',
                accountStatus: 'ACTIVE'
            },
            {
                title: 'Ms',
                firstName: 'RSGWA',
                lastName: 'Officer',
                email: 'rsgwa@test.com',
                phone: '9876543212',
                password,
                dateOfBirth: new Date('1988-08-15'),
                gender: 'FEMALE',
                idProofType: 'PAN',
                idProofNumber: 'FGHIJ5678K',
                userType: 'RSGWA',
                communicationAddress: {
                    addressLine1: 'RSGWA Office',
                    state: 'RAJASTHAN',
                    district: 'JAIPUR',
                    pincode: '302001'
                },
                emailVerified: true,
                phoneVerified: true,
                verificationStatus: 'VERIFIED',
                accountStatus: 'ACTIVE'
            }
        ]);

        console.log(`✅ ${users.length} users seeded`);
        console.log('\n📧 Test Credentials:');
        console.log('   Applicant: applicant@test.com / Password@123');
        console.log('   DGO: dgo@test.com / Password@123');
        console.log('   RSGWA: rsgwa@test.com / Password@123\n');

        return users;
    } catch (error) {
        console.error('❌ Users seeding failed:', error);
        throw error;
    }
};

module.exports = usersSeeder;

if (require.main === module) {
    usersSeeder()
        .then(() => {
            console.log('Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
