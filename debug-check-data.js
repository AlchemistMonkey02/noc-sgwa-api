const mongoose = require('mongoose');
require('dotenv').config();

const BlockSchema = new mongoose.Schema({
    blockId: String,
    blockName: String,
    districtId: String,
    category: String
});

const Block = mongoose.model('Block', BlockSchema);

async function check() {
    try {
        // Use the SAME default as db.config.js
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sgwa_db';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);

        const count = await Block.countDocuments();
        console.log('Total Blocks:', count);

        const jaipurBlocks = await Block.find({ districtId: 'JAIPUR' });
        console.log('Blocks with districtId="JAIPUR":', jaipurBlocks.length);

        if (jaipurBlocks.length > 0) {
            console.log('Sample:', jaipurBlocks[0]);
        } else {
            console.log('All Blocks Sample:');
            const all = await Block.find().limit(5);
            console.log(all);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
