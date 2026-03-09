require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('./app/config/db.config');
const Company = require('./app/company/company.model');

async function seedCompany() {
    try {
        await mongoose.connect(dbConfig.url);

        const userId = '699fd74ca9fb6cc3ccf1b183';
        const companyData = {
            userId: userId,
            companyName: 'Test Infrastructure Corp',
            companyType: 'PRIVATE_LIMITED',
            industryType: 'INFRASTRUCTURE',
            gstNumber: '08AAAAA0000A1Z1',
            panNumber: 'AAAAA0000A',
            email: 'contact@testcorp.com',
            phone: '9876543210',
            registeredAddress: {
                addressLine1: '123 Test Street',
                state: 'RAJASTHAN',
                district: 'JAIPUR',
                pincode: '302001'
            },
            verificationStatus: 'VERIFIED',
            status: 'ACTIVE',
            isApproved: true
        };

        const company = await Company.findOneAndUpdate(
            { userId: userId },
            companyData,
            { upsert: true, new: true }
        );

        console.log('✓ Company Seeded/Updated:', company._id);
    } catch (error) {
        console.error('✗ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seedCompany();
