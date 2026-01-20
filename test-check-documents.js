// Test what's in the documents field
require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('./app/config/db.config');

async function checkDocuments() {
    try {
        await mongoose.connect(dbConfig.url);
        console.log('Connected to MongoDB\n');

        const NOCApplication = require('./app/noc/noc-application.model');

        const trackingId = 'REF-20260110-6106';
        const app = await NOCApplication.findOne({ trackingId });

        if (app) {
            console.log('Application found:');
            console.log('  Tracking ID:', app.trackingId);
            console.log('  Application Number:', app.applicationNumber);
            console.log('  Documents array length:', app.documents?.length || 0);
            console.log('\nDocument details:');

            if (app.documents && app.documents.length > 0) {
                app.documents.forEach((doc, index) => {
                    console.log(`\n  Document ${index + 1}:`);
                    console.log('    Type:', doc.documentType);
                    console.log('    ID:', doc.documentId);
                    console.log('    File:', doc.fileName);
                    console.log('    Verified:', doc.isVerified);
                    console.log('    Full object:', JSON.stringify(doc, null, 2));
                });
            } else {
                console.log('  No documents in array');
            }
        } else {
            console.log('Application not found');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDocuments();
