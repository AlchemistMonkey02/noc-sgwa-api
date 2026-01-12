require('dotenv').config();
const mongoose = require('mongoose');

async function fixData() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sgwa-db');

    // Update States
    const State = mongoose.model('State', new mongoose.Schema({
        stateId: String, stateName: String, stateCode: String, isActive: Boolean
    }, { timestamps: true }));

    await State.updateMany({}, { $set: { isActive: true } });
    console.log('✅ Updated all states with isActive: true');

    // Update Districts
    const District = mongoose.model('District', new mongoose.Schema({
        districtId: String, districtName: String, stateId: String, isActive: Boolean
    }));

    await District.updateMany({}, { $set: { isActive: true } });
    console.log('✅ Updated all districts with isActive: true');

    // Update Blocks
    const Block = mongoose.model('Block', new mongoose.Schema({
        blockId: String, blockName: String, districtId: String, category: String, isActive: Boolean
    }));

    await Block.updateMany({}, { $set: { isActive: true } });
    console.log('✅ Updated all blocks with isActive: true');

    // Verify
    const stateCount = await State.countDocuments({ isActive: true });
    const districtCount = await District.countDocuments({ isActive: true });
    const blockCount = await Block.countDocuments({ isActive: true });

    console.log(`\n📊 Summary:`);
    console.log(`   States: ${stateCount} active`);
    console.log(`   Districts: ${districtCount} active`);
    console.log(`   Blocks: ${blockCount} active`);

    await mongoose.disconnect();
    process.exit(0);
}

fixData().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
