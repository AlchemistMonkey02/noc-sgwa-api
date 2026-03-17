const mongoose = require('mongoose');

async function repair() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const NOCApplication = mongoose.connection.db.collection('nocapplications');
        const Document = mongoose.connection.db.collection('documents');

        const apps = await NOCApplication.find({ 'documents.documentId': /^doc_/ }).toArray();
        console.log(`Found ${apps.length} applications with corrupted document IDs`);

        for (const app of apps) {
            console.log(`Repairing application: ${app.applicationId}`);
            let updated = false;
            const newDocs = [...app.documents];

            for (let i = 0; i < newDocs.length; i++) {
                const doc = newDocs[i];
                if (doc.documentId.startsWith('doc_')) {
                    // Try to find the real document in standalone collection
                    const realDoc = await Document.findOne({
                        userId: app.userId,
                        applicationId: app.applicationId,
                        documentType: doc.documentType
                    });

                    if (realDoc) {
                        console.log(`  Replacing ${doc.documentId} with ${realDoc.documentId} for type ${doc.documentType}`);
                        newDocs[i].documentId = realDoc.documentId;
                        updated = true;
                    } else {
                        console.warn(`  No standalone match found for type ${doc.documentType} in application ${app.applicationId}`);
                    }
                }
            }

            if (updated) {
                await NOCApplication.updateOne(
                    { _id: app._id },
                    { $set: { documents: newDocs } }
                );
                console.log(`  Successfully updated application ${app.applicationId}`);
            }
        }

        console.log('Repair complete');
    } catch (err) {
        console.error('Repair failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

repair();
