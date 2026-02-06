const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ApplicationSubType = mongoose.model('ApplicationSubType', new mongoose.Schema({ appSubTypeCode: Number, appTypeCode: Number, name: String, isActive: Boolean }), 'applicationsubtypes');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const duplicates = await ApplicationSubType.aggregate([
            { $group: { _id: '$appSubTypeCode', count: { $sum: 1 }, types: { $addToSet: '$appTypeCode' } } },
            { $match: { count: { $gt: 1 } } }
        ]);
        console.log(JSON.stringify(duplicates, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
});
