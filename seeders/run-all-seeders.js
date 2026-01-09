const mongoose = require('mongoose');
require('dotenv').config();

async function runAllSeeders() {
    try {
        console.log('🚀 Starting Database Seeding...\n');
        console.log('━'.repeat(50));

        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sgwa-db');
        console.log('✅ Connected to MongoDB\n');

        // Run seeders in order
        console.log('━'.repeat(50));
        await require('./01-master-data.seeder')();

        console.log('━'.repeat(50));
        const users = await require('./02-users.seeder')();

        console.log('━'.repeat(50));
        await require('./03-companies.seeder')(users[0]._id);

        console.log('━'.repeat(50));
        console.log('\n🎉 All seeders completed successfully!\n');
        console.log('📊 Summary:');
        console.log('   ✅ Master data seeded');
        console.log('   ✅ 3 test users created');
        console.log('   ✅ 2 test companies created');
        console.log('\n📝 Ready to test with:');
        console.log('   Email: applicant@test.com');
        console.log('   Password: Password@123');
        console.log('━'.repeat(50));

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seeding failed:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

runAllSeeders();
