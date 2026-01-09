const mongoose = require('mongoose');
require('dotenv').config();

const companiesSeeder = async (userId) => {
    try {
        console.log('🌱 Seeding Companies...');

        // Connect if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sgwa-db');
        }

        const Company = require('../app/company/company.model');
        const User = require('../app/auth/user.model');

        await Company.deleteMany({});

        // Get applicant user
        const applicant = userId || (await User.findOne({ email: 'applicant@test.com' }))._id;

        if (!applicant) {
            console.log('⚠️  No applicant user found. Run users seeder first.');
            return [];
        }

        const companies = await Company.insertMany([
            {
                companyId: 'COMP_' + Date.now(),
                companyName: 'Test Industries Pvt Ltd',
                registrationNumber: 'U12345RJ2020PTC067890',
                companyType: 'PRIVATE_LIMITED',
                gstNumber: '22AAAAA0000A1Z5',
                panNumber: 'AAAAA0000A',
                address: {
                    addressLine1: 'Plot 456, Industrial Area',
                    city: 'Jaipur',
                    state: 'Rajasthan',
                    pincode: '302013'
                },
                contactPerson: {
                    name: 'Test Applicant',
                    designation: 'Director',
                    phone: '9876543210',
                    email: 'applicant@test.com'
                },
                ownerId: applicant,
                isVerified: true,
                verificationStatus: 'VERIFIED'
            },
            {
                companyId: 'COMP_' + (Date.now() + 1),
                companyName: 'Sample Manufacturing Ltd',
                registrationNumber: 'U99999RJ2021PTC099999',
                companyType: 'PRIVATE_LIMITED',
                gstNumber: '22BBBBB0000B1Z5',
                panNumber: 'BBBBB0000B',
                address: {
                    addressLine1: 'Plot 789, RIICO Area',
                    city: 'Jaipur',
                    state: 'Rajasthan',
                    pincode: '302029'
                },
                contactPerson: {
                    name: 'Test Applicant',
                    designation: 'Managing Director',
                    phone: '9876543210',
                    email: 'applicant@test.com'
                },
                ownerId: applicant,
                isVerified: true,
                verificationStatus: 'VERIFIED'
            }
        ]);

        console.log(`✅ ${companies.length} companies seeded\n`);
        return companies;
    } catch (error) {
        console.error('❌ Companies seeding failed:', error);
        throw error;
    }
};

module.exports = companiesSeeder;

if (require.main === module) {
    companiesSeeder()
        .then(() => {
            console.log('Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
