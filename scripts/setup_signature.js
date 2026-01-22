require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dbConfig = require('../app/config/db.config');
const User = require('../app/auth/user.model');
const Document = require('../app/documents/document.model');
const { v4: uuidv4 } = require('uuid');

// A simple 1x1 black pixel PNG (or slightly larger red dot)
const SIGNATURE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAJYAAAAyCAYAAACjbzbIAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACwSURBVHhe7dGxCYAwFADBo93/byzCwmLjCDaWi93Bn8/xO8552+f9h4g7IswRYY4Ic0SYI8IcEeaIMEeEOSLMEmGOCHNEmCPCHBHmiDBHhDkisBHmiDBHhDkizBFhjghzRJgjwhwR5ogwR4Q5IswRYY4Is0SYI8IcEeaIMEeEOSLMEWGOCHNEmCPCHBHmiDBHhDkizBFhjghzRJgjwgwR5ogwR4Q5IswRYY4Ic0SYI8IcEeaIsE+5AyrZ314z1AAAAABJRU5ErkJggg==";

async function setupSignature() {
    try {
        await mongoose.connect(dbConfig.url);

        // 1. Find Specific Enforcement User
        const officerId = "6964cfa5400785e8c03914f9";
        const user = await User.findById(officerId);
        if (!user) {
            console.log("Specific ENFORCEMENT user NOT FOUND!");
            return;
        }
        console.log(`Found Enforcement User: ${user.email}`);

        // 2. Create Dummy Image File
        const buffer = Buffer.from(SIGNATURE_BASE64, 'base64');
        const uploadDir = path.join(__dirname, '../uploads/documents');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const finalPath = path.join(uploadDir, 'officer_signature_' + user._id + '.png');
        fs.writeFileSync(finalPath, buffer);
        console.log("Created signature file at:", finalPath);

        // 3. Create Verification/Signature document directly
        // Check if one already exists to avoid duplicates
        let doc = await Document.findOne({
            userId: user._id,
            documentType: 'OTHER',
            originalFilename: 'signature.png'
        });

        if (!doc) {
            doc = new Document({
                documentId: uuidv4(),
                userId: user._id,
                documentType: 'OTHER',
                documentName: 'Digital Signature',
                originalFilename: 'signature.png',
                storedFilename: 'officer_signature_' + user._id + '.png',
                filePath: finalPath,
                mimeType: 'image/png',
                fileSize: buffer.length,
                uploadedAt: new Date(),
                status: 'VERIFIED',
                isVerified: true
            });
            await doc.save();
            console.log("Created NEW Document record:", doc._id);
        } else {
            console.log("Updating EXISTING Document record:", doc._id);
            doc.filePath = finalPath;
            doc.fileSize = buffer.length;
            doc.storedFilename = 'officer_signature_' + user._id + '.png';
            doc.documentId = doc.documentId || uuidv4(); // Ensure ID exists
            await doc.save();
        }

        // Link to User
        user.signature = doc._id;
        await user.save();
        console.log("Linked Signature to User");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

setupSignature();
