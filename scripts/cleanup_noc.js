const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const NOCCertificateSchema = new mongoose.Schema({}, { strict: false });
const NOCApplicationSchema = new mongoose.Schema({}, { strict: false });

const NOCCertificate = mongoose.model('NOCCertificate', NOCCertificateSchema);
const NOCApplication = mongoose.model('NOCApplication', NOCApplicationSchema);

const DB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/sgwa_db';

async function cleanup() {
    try {
        await mongoose.connect(DB_URL);
        console.log('Connected to DB');

        const appId = '696385af85ba8d751b6f1d3a';

        // NOC IDs to delete
        const nocIdsToDelete = [
            'RJ/CGWA/NOC/2026/000004',
            'RJ/CGWA/NOC/2026/000005',
            'RJ/CGWA/NOC/2026/000006'
        ];

        console.log(`Cleaning up NOC IDs: ${nocIdsToDelete.join(', ')} for App: ${appId}`);

        // Checking existence
        const count = await NOCCertificate.countDocuments({ nocId: { $in: nocIdsToDelete } });
        console.log(`Found ${count} certificate(s) to delete`);

        // Delete the certificates
        const delCert = await NOCCertificate.deleteMany({ nocId: { $in: nocIdsToDelete } });
        console.log('Delete by NOC ID Result:', delCert);

        // Also delete by App ID to be safe
        const delCertApp = await NOCCertificate.deleteMany({ applicationId: appId });
        console.log(`Deleted by App ID ${appId}:`, delCertApp);

        // Reset application status
        const updateApp = await NOCApplication.updateOne(
            { _id: appId },
            {
                $unset: { nocCertificateId: 1, issuanceDate: 1 },
                $set: { status: 'APPROVED_SGWA' }
            }
        );
        console.log('Application reset Result:', updateApp);

        console.log('Cleanup complete.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

cleanup();
