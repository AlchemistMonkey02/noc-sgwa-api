require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('./app/config/db.config');
const Company = require('./app/company/company.model');

async function findCompany() {
    try {
        await mongoose.connect(dbConfig.url);
        const company = await Company.findOne({ userId: '699fd74ca9fb6cc3ccf1b183' });
        if (company) {
            console.log('Company ID:', company._id);
        } else {
            console.log('No company found for this user.');
            // Let's find ANY company
            const anyCompany = await Company.findOne();
            if (anyCompany) {
                console.log('Any Company ID:', anyCompany._id);
                console.log('Owner ID:', anyCompany.owner);
            }
        }
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

findCompany();
