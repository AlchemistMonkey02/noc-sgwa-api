const mongoose = require('mongoose');
require('dotenv').config();

const masterDataSeeder = async () => {
    try {
        console.log('🌱 Seeding Master Data...');

        // Connect if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sgwa-db');
        }

        // States
        const State = mongoose.model('State', new mongoose.Schema({
            stateId: String,
            stateName: String,
            stateCode: String
        }));

        await State.deleteMany({});
        const states = await State.insertMany([
            { stateId: 'RAJ', stateName: 'Rajasthan', stateCode: 'RJ' },
            { stateId: 'GUJ', stateName: 'Gujarat', stateCode: 'GJ' },
            { stateId: 'MAH', stateName: 'Maharashtra', stateCode: 'MH' },
            { stateId: 'DEL', stateName: 'Delhi', stateCode: 'DL' }
        ]);

        console.log(`✅ ${states.length} states seeded`);

        // Districts
        const District = mongoose.model('District', new mongoose.Schema({
            districtId: String,
            districtName: String,
            stateId: String
        }));

        await District.deleteMany({});
        const districts = await District.insertMany([
            { districtId: 'JAIPUR', districtName: 'Jaipur', stateId: 'RAJ' },
            { districtId: 'JODHPUR', districtName: 'Jodhpur', stateId: 'RAJ' },
            { districtId: 'UDAIPUR', districtName: 'Udaipur', stateId: 'RAJ' },
            { districtId: 'AJMER', districtName: 'Ajmer', stateId: 'RAJ' }
        ]);

        console.log(`✅ ${districts.length} districts seeded`);

        console.log('✅ Master Data seeding completed!\n');

        return { states, districts };
    } catch (error) {
        console.error('❌ Master data seeding failed:', error);
        throw error;
    }
};

module.exports = masterDataSeeder;

if (require.main === module) {
    masterDataSeeder()
        .then(() => {
            console.log('Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
