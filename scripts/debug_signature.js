require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('../app/config/db.config');
const User = require('../app/auth/user.model');
const Document = require('../app/documents/document.model');
const fs = require('fs');

async function debugSignature() {
    try {
        await mongoose.connect(dbConfig.url);

        const officerId = "6964cfa5400785e8c03914f9"; // from user's JSON response

        console.log(`Checking Officer: ${officerId}`);
        const officer = await User.findById(officerId);

        if (!officer) {
            console.log("Officer NOT FOUND");
            return;
        }

        console.log("Officer Found:", officer.email);
        console.log("Signature Field:", officer.signature);

        if (officer.signature) {
            const doc = await Document.findById(officer.signature);
            if (doc) {
                console.log("Signature Document Found:", doc._id);
                console.log("File Path:", doc.filePath);
                console.log("File Exists:", fs.existsSync(doc.filePath));
            } else {
                console.log("Signature Document ID exists in User but Document record NOT FOUND in DB");
            }
        } else {
            console.log("Officer has NO signature field set.");

            // Fix it now if missing
            console.log("Attempting to link a signature now...");

            // Find ANY valid signature document (created by setup_signature.js maybe?)
            const anyDoc = await Document.findOne({ fileName: 'signature.png' });
            if (anyDoc) {
                officer.signature = anyDoc._id;
                await officer.save();
                console.log(`FIXED: Linked existing signature doc ${anyDoc._id} to officer.`);
            } else {
                console.log("No dummy signature document found to link. Run setup_signature.js first.");
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

debugSignature();
