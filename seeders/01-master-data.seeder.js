const mongoose = require('mongoose');
require('dotenv').config();

const masterDataSeeder = async () => {
    try {
        console.log('🌱 Seeding Master Data...');

        // Connect to the correct database (noc)
        let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sgwa_db';
        if (uri.includes('mongodb.net') && !uri.includes('/noc')) {
            uri = uri.replace('mongodb.net/', 'mongodb.net/noc');
            if (!uri.includes('mongodb.net/noc')) { // if it didn't have slash
                uri = uri.replace('mongodb.net?', 'mongodb.net/noc?');
            }
        }

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(uri);
            console.log(`Connected to: ${uri.replace(/:[^:@]*@/, ':****@')}`);
        }

        // States
        const State = mongoose.model('State', new mongoose.Schema({
            stateId: String,
            stateName: String,
            stateCode: String,
            isActive: Boolean
        }));

        await State.deleteMany({});
        const states = await State.insertMany([
            { stateId: 'RJ', stateName: 'Rajasthan', stateCode: 'RJ', isActive: true },
            { stateId: 'GJ', stateName: 'Gujarat', stateCode: 'GJ', isActive: true },
            { stateId: 'MH', stateName: 'Maharashtra', stateCode: 'MH', isActive: true },
            { stateId: 'DL', stateName: 'Delhi', stateCode: 'DL', isActive: true },
            { stateId: 'UP', stateName: 'Uttar Pradesh', stateCode: 'UP', isActive: true }
        ]);

        console.log(`✅ ${states.length} states seeded`);

        // Districts
        const District = mongoose.model('District', new mongoose.Schema({
            districtId: String,
            districtName: String,
            stateId: String,
            isActive: Boolean
        }));

        const rajasthanDistricts = [
            'Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner',
            'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur', 'Hanumangarh',
            'Jaipur', 'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli',
            'Kota', 'Nagaur', 'Pali', 'Pratapgarh', 'Rajsamand', 'Sawai Madhopur', 'Sikar',
            'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur'
        ];

        const districtDocs = rajasthanDistricts.map(name => ({
            districtId: name.toUpperCase(),
            districtName: name,
            stateId: 'RJ',
            isActive: true
        }));

        // Add some other states' districts
        districtDocs.push(
            { districtId: 'AHM', districtName: 'Ahmedabad', stateId: 'GJ', isActive: true },
            { districtId: 'SUT', districtName: 'Surat', stateId: 'GJ', isActive: true },
            { districtId: 'MUM', districtName: 'Mumbai', stateId: 'MH', isActive: true },
            { districtId: 'PUN', districtName: 'Pune', stateId: 'MH', isActive: true }
        );

        await District.deleteMany({});
        const districts = await District.insertMany(districtDocs);

        console.log(`✅ ${districts.length} districts seeded`);

        // Blocks (Sub-districts)
        const Block = mongoose.model('Block', new mongoose.Schema({
            blockId: String,
            blockName: String,
            districtId: String,
            category: String,
            isActive: Boolean
        }));

        const blockDocs = [
            // Jaipur
            { blockId: 'SANG', blockName: 'Sanganer', districtId: 'JAIPUR', category: 'SEMI_CRITICAL', isActive: true },
            { blockId: 'AMER', blockName: 'Amer', districtId: 'JAIPUR', category: 'SAFE', isActive: true },
            { blockId: 'CHAK', blockName: 'Chaksu', districtId: 'JAIPUR', category: 'SAFE', isActive: true },
            { blockId: 'PHAG', blockName: 'Phagi', districtId: 'JAIPUR', category: 'CRITICAL', isActive: true },
            { blockId: 'AMBER', blockName: 'Amber', districtId: 'JAIPUR', category: 'CRITICAL', isActive: true },
            { blockId: 'JHOTWARA', blockName: 'Jhotwara', districtId: 'JAIPUR', category: 'OVER_EXPLOITED', isActive: true },
            { blockId: 'KOTPUTLI', blockName: 'Kotputli', districtId: 'JAIPUR', category: 'CRITICAL', isActive: true },

            // Jodhpur
            { blockId: 'JODH', blockName: 'Jodhpur', districtId: 'JODHPUR', category: 'CRITICAL', isActive: true },
            { blockId: 'OSIAN', blockName: 'Osian', districtId: 'JODHPUR', category: 'SAFE', isActive: true },

            // Udaipur
            { blockId: 'UDAI', blockName: 'Udaipur', districtId: 'UDAIPUR', category: 'SAFE', isActive: true },

            // Kota
            { blockId: 'KOTA', blockName: 'Kota', districtId: 'KOTA', category: 'SEMI_CRITICAL', isActive: true },

            // Bikaner
            { blockId: 'BKNR', blockName: 'Bikaner', districtId: 'BIKANER', category: 'SAFE', isActive: true },

            // Ajmer
            { blockId: 'AJMER', blockName: 'Ajmer', districtId: 'AJMER', category: 'SEMI_CRITICAL', isActive: true },
        ];

        // Add 1 generic block for every other Rajasthan district
        rajasthanDistricts.forEach(dist => {
            const distId = dist.toUpperCase();
            // check if we already added blocks for this district manually
            if (!['JAIPUR', 'JODHPUR', 'UDAIPUR', 'KOTA', 'BIKANER', 'AJMER'].includes(distId)) {
                blockDocs.push({
                    blockId: `${distId}_BLK`,
                    blockName: `${dist} Block`,
                    districtId: distId,
                    category: 'SAFE', // Default
                    isActive: true
                });
            }
        });

        await Block.deleteMany({});
        const blocks = await Block.insertMany(blockDocs);

        console.log(`✅ ${blocks.length} blocks seeded`);

        // Tehsils
        const Tehsil = mongoose.model('Tehsil', new mongoose.Schema({
            tehsilId: String,
            tehsilName: String,
            districtId: String,
            isActive: Boolean
        }));

        const tehsilDocs = [
            // Jaipur
            { tehsilId: 'SANGANER', tehsilName: 'Sanganer', districtId: 'JAIPUR', isActive: true },
            { tehsilId: 'AMER', tehsilName: 'Amer', districtId: 'JAIPUR', isActive: true },
            { tehsilId: 'CHAKSU', tehsilName: 'Chaksu', districtId: 'JAIPUR', isActive: true },
            { tehsilId: 'PHAGI', tehsilName: 'Phagi', districtId: 'JAIPUR', isActive: true },
            { tehsilId: 'JAIPUR', tehsilName: 'Jaipur', districtId: 'JAIPUR', isActive: true },
            { tehsilId: 'BASSI', tehsilName: 'Bassi', districtId: 'JAIPUR', isActive: true },
            { tehsilId: 'KOTPUTLI', tehsilName: 'Kotputli', districtId: 'JAIPUR', isActive: true },
            { tehsilId: 'VIRATNAGAR', tehsilName: 'Viratnagar', districtId: 'JAIPUR', isActive: true },
            { tehsilId: 'SHAHPURA', tehsilName: 'Shahpura', districtId: 'JAIPUR', isActive: true },
            { tehsilId: 'JAMWARAMGARH', tehsilName: 'Jamwa Ramgarh', districtId: 'JAIPUR', isActive: true },
            { tehsilId: 'SAMBHAR', tehsilName: 'Sambhar', districtId: 'JAIPUR', isActive: true },

            // Jodhpur
            { tehsilId: 'JODHPUR', tehsilName: 'Jodhpur', districtId: 'JODHPUR', isActive: true },
            { tehsilId: 'BILARA', tehsilName: 'Bilara', districtId: 'JODHPUR', isActive: true },
            { tehsilId: 'LUNI', tehsilName: 'Luni', districtId: 'JODHPUR', isActive: true },
            { tehsilId: 'OSIAN', tehsilName: 'Osian', districtId: 'JODHPUR', isActive: true },

            // Ajmer
            { tehsilId: 'AJMER', tehsilName: 'Ajmer', districtId: 'AJMER', isActive: true },
            { tehsilId: 'PUSHKAR', tehsilName: 'Pushkar', districtId: 'AJMER', isActive: true },
            { tehsilId: 'BEAWAR', tehsilName: 'Beawar', districtId: 'AJMER', isActive: true },
            { tehsilId: 'KEKRI', tehsilName: 'Kekri', districtId: 'AJMER', isActive: true },

            // Kota
            { tehsilId: 'KOTA', tehsilName: 'Kota', districtId: 'KOTA', isActive: true },
            { tehsilId: 'LADPURA', tehsilName: 'Ladpura', districtId: 'KOTA', isActive: true },
            { tehsilId: 'DIGOD', tehsilName: 'Digod', districtId: 'KOTA', isActive: true },
            { tehsilId: 'PIPALDA', tehsilName: 'Pipalda', districtId: 'KOTA', isActive: true },
            { tehsilId: 'RAMGANJMANDI', tehsilName: 'Ramganj Mandi', districtId: 'KOTA', isActive: true },

            // Bikaner
            { tehsilId: 'BIKANER', tehsilName: 'Bikaner', districtId: 'BIKANER', isActive: true },
            { tehsilId: 'LUNKARANSAR', tehsilName: 'Lunkaransar', districtId: 'BIKANER', isActive: true },
            { tehsilId: 'NOKHA', tehsilName: 'Nokha', districtId: 'BIKANER', isActive: true },
            { tehsilId: 'KOLAYAT', tehsilName: 'Kolayat', districtId: 'BIKANER', isActive: true },
            { tehsilId: 'DUNGARGARH', tehsilName: 'Dungargarh', districtId: 'BIKANER', isActive: true },

            // Udaipur
            { tehsilId: 'GIRWA', tehsilName: 'Girwa', districtId: 'UDAIPUR', isActive: true },
            { tehsilId: 'MAVLI', tehsilName: 'Mavli', districtId: 'UDAIPUR', isActive: true },
            { tehsilId: 'VALLABHNAGAR', tehsilName: 'Vallabhnagar', districtId: 'UDAIPUR', isActive: true },
            { tehsilId: 'KHERWARA', tehsilName: 'Kherwara', districtId: 'UDAIPUR', isActive: true },
            { tehsilId: 'SALUMBAR', tehsilName: 'Salumbar', districtId: 'UDAIPUR', isActive: true },
            { tehsilId: 'SARADA', tehsilName: 'Sarada', districtId: 'UDAIPUR', isActive: true },
            { tehsilId: 'KOTRA', tehsilName: 'Kotra', districtId: 'UDAIPUR', isActive: true },
            { tehsilId: 'JHADOL', tehsilName: 'Jhadol', districtId: 'UDAIPUR', isActive: true },
            { tehsilId: 'RISHABHDEO', tehsilName: 'Rishabhdeo', districtId: 'UDAIPUR', isActive: true },
            { tehsilId: 'GOGUNDA', tehsilName: 'Gogunda', districtId: 'UDAIPUR', isActive: true },
            { tehsilId: 'LASADIYA', tehsilName: 'Lasadiya', districtId: 'UDAIPUR', isActive: true },
            { tehsilId: 'BADGAON', tehsilName: 'Badgaon', districtId: 'UDAIPUR', isActive: true },

        ];

        // Generic Tehsils for other districts
        rajasthanDistricts.forEach(dist => {
            const distId = dist.toUpperCase();
            if (!['JAIPUR', 'JODHPUR', 'AJMER', 'KOTA', 'BIKANER', 'UDAIPUR'].includes(distId)) {
                tehsilDocs.push({
                    tehsilId: `${distId}_TEH`,
                    tehsilName: `${dist} Tehsil`,
                    districtId: distId,
                    isActive: true
                });
            }
        });

        await Tehsil.deleteMany({});
        const tehsils = await Tehsil.insertMany(tehsilDocs);
        console.log(`✅ ${tehsils.length} tehsils seeded`);

        // Fee Structures
        const FeeStructure = mongoose.model('FeeStructure', new mongoose.Schema({
            feeId: String,
            applicationType: String,
            blockCategory: String,
            baseAmount: Number,
            processingFee: Number,
            waterBudgetCharges: Number,
            ecChargesPerMLD: Number,
            effectiveFrom: Date,
            isActive: Boolean
        }));

        const feeDocs = [];
        const appTypes = ['NEW', 'RENEWAL', 'AMENDMENT'];
        const categories = ['SAFE', 'SEMI_CRITICAL', 'CRITICAL', 'OVER_EXPLOITED', 'ALL'];

        appTypes.forEach(type => {
            categories.forEach(cat => {
                feeDocs.push({
                    feeId: `FEE_${type}_${cat}`,
                    applicationType: type,
                    blockCategory: cat,
                    baseAmount: 10000,
                    processingFee: 5000,
                    waterBudgetCharges: cat === 'SAFE' ? 0 : 10000,
                    ecChargesPerMLD: cat === 'OVER_EXPLOITED' ? 100 : 50,
                    effectiveFrom: new Date(),
                    isActive: true
                });
            });
        });

        await FeeStructure.deleteMany({});
        const fees = await FeeStructure.insertMany(feeDocs);
        console.log(`✅ ${fees.length} fee structures seeded`);

        // Flow Meter Master Data
        const MasterData = require('../app/master-data/master-data.model');
        const flowMeterData = [
            // Manufacturers
            { type: "METER_MANUFACTURER", code: "KROHNE", label: "Krohne Marshall" },
            { type: "METER_MANUFACTURER", code: "ABB", label: "ABB India" },
            { type: "METER_MANUFACTURER", code: "ENDRESS", label: "Endress+Hauser" },
            { type: "METER_MANUFACTURER", code: "HONEYWELL", label: "Honeywell Automation" },
            { type: "METER_MANUFACTURER", code: "SIEMENS", label: "Siemens Ltd" },
            { type: "METER_MANUFACTURER", code: "YOKOGAWA", label: "Yokogawa India" },

            // Models (Linked via metadata)
            { type: "METER_MODEL", code: "OPTIFLUX_2300", label: "OPTIFLUX 2300", metadata: { manufacturer: "KROHNE" } },
            { type: "METER_MODEL", code: "OPTIFLUX_4300", label: "OPTIFLUX 4300", metadata: { manufacturer: "KROHNE" } },
            { type: "METER_MODEL", code: "WATERMASTER", label: "WaterMaster", metadata: { manufacturer: "ABB" } },
            { type: "METER_MODEL", code: "AQUAGROUP", label: "AquaMaster", metadata: { manufacturer: "ABB" } },
            { type: "METER_MODEL", code: "PROMAG_W_400", label: "Proline Promag W 400", metadata: { manufacturer: "ENDRESS" } },
            { type: "METER_MODEL", code: "PROMAG_10", label: "Promag 10", metadata: { manufacturer: "ENDRESS" } },
            { type: "METER_MODEL", code: "VERSAFLOW", label: "VersaFlow Mag 100", metadata: { manufacturer: "HONEYWELL" } },
            { type: "METER_MODEL", code: "SITRANS_FM", label: "SITRANS FM MAG 5100 W", metadata: { manufacturer: "SIEMENS" } },
            { type: "METER_MODEL", code: "ADMAG_AXW", label: "ADMAG AXW Series", metadata: { manufacturer: "YOKOGAWA" } },

            // Serial Numbers (Dummy Data for Testing)
            { type: "METER_SERIAL_NUMBER", code: "SN_001", label: "KM-2024-88392", metadata: { manufacturer: "KROHNE" } },
            { type: "METER_SERIAL_NUMBER", code: "SN_002", label: "ABB-WM-9982", metadata: { manufacturer: "ABB" } },
            { type: "METER_SERIAL_NUMBER", code: "SN_003", label: "EH-PM-7721", metadata: { manufacturer: "ENDRESS" } },
            { type: "METER_SERIAL_NUMBER", code: "SN_004", label: "SI-2025-998877", metadata: { manufacturer: "SIEMENS" } },
            { type: "METER_SERIAL_NUMBER", code: "SN_005", label: "HW-VF-1122", metadata: { manufacturer: "HONEYWELL" } },

            // Telemetry Providers
            { type: "TELEMETRY_PROVIDER", code: "VODAFONE", label: "Vodafone IoT Services" },
            { type: "TELEMETRY_PROVIDER", code: "AIRTEL", label: "Airtel IoT" },
            { type: "TELEMETRY_PROVIDER", code: "JIO", label: "Jio Things" },
            { type: "TELEMETRY_PROVIDER", code: "TATA", label: "Tata Communications" },

            // BIS Standards
            { type: "BIS_STANDARD", code: "IS_2373", label: "IS 2373:1981 - Water Meters (Bulk Type)" },
            { type: "BIS_STANDARD", code: "IS_779", label: "IS 779:1994 - Water Meters (Domestic Type)" },
            { type: "BIS_STANDARD", code: "IS_6784", label: "IS 6784:1996 - Electromagnetic Flow Meters" },
            { type: "BIS_STANDARD", code: "IS_15100", label: "IS 15100:2002 - Ultrasonic Flow Meters" },
            { type: "BIS_STANDARD", code: "ISO_4064", label: "ISO 4064 - Water Meters for Cold Potable Water" },

            // NABL Accredited Labs
            { type: "NABL_LAB", code: "SGS", label: "SGS India Pvt. Ltd." },
            { type: "NABL_LAB", code: "VIMTA", label: "Vimta Labs Ltd." },
            { type: "NABL_LAB", code: "TUV", label: "TUV SUD South Asia" },
            { type: "NABL_LAB", code: "SHRIRAM", label: "Shriram Institute for Industrial Research" },
            { type: "NABL_LAB", code: "SPECTRO", label: "Spectro Analytical Labs" },
            { type: "NABL_LAB", code: "GOVT_LAB", label: "State Government PHED Lab" },
            { type: "NABL_LAB", code: "OTHER", label: "Other NABL Accredited Lab" }
        ];

        // Clean existing flow meter data & NABL labs
        await MasterData.deleteMany({
            type: { $in: ["METER_MANUFACTURER", "METER_MODEL", "METER_SERIAL_NUMBER", "TELEMETRY_PROVIDER", "BIS_STANDARD", "NABL_LAB"] }
        });

        const seededMasterData = await MasterData.insertMany(flowMeterData);
        console.log(`✅ ${seededMasterData.length} flow meter master data items seeded`);

        console.log('✅ Master Data seeding completed!\n');

        return { states, districts, blocks, tehsils, fees };
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
