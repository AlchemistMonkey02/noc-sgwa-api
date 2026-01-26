
const mongoose = require('mongoose');
const Document = require('./app/documents/document.model');
require('dotenv').config();

async function checkDocument() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const docId = '8fa98464-d76f-4d2d-833a-bd27eae77b76';

        console.log(`Checking for document: ${docId}`);

        const doc = await Document.findOne({ documentId: docId });

        if (doc) {
            console.log("Document FOUND in DB:");
            console.log(JSON.stringify(doc, null, 2));

            // basic file existence check
            const fs = require('fs');
            if (fs.existsSync(doc.filePath)) {
                console.log(`File exists on disk at: ${doc.filePath}`);
            } else {
                console.log(`File MISSING on disk at: ${doc.filePath}`);
            }

        } else {
            console.log("Document NOT FOUND in DB.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkDocument();
