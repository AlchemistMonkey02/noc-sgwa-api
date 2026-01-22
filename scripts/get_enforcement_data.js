require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('../app/config/db.config');
const User = require('../app/auth/user.model');
const NOCApplication = require('../app/noc/noc-application.model');
const NOCCertificate = require('../app/noc/noc-certificate.model');

async function getEnforcementTestData() {
    try {
        await mongoose.connect(dbConfig.url);
        console.log("Connected to DB");

        const data = {};

        // 1. Enforcement User
        // Try to find user with userType='ENFORCEMENT' or role='ENFORCEMENT'
        // Schema says userType: enum ["APPLICANT", "DGO", "RSGWA", "ENFORCEMENT", ...]
        const officer = await User.findOne({ userType: 'ENFORCEMENT' });
        if (officer) {
            data.officer = {
                username: officer.username,
                email: officer.email,
                id: officer._id
            };
        } else {
            // Fallback: Check if there's any user we can use or maybe mock it
            console.log("No ENFORCEMENT user found. Please create one.");
        }

        // 2. Pending Application (For Approval Queue, Issue, Reject, Return, Query)
        // Status: "PENDING_ENFORCEMENT_REVIEW" or "UNDER_REVIEW_ENFORCEMENT"
        const pendingApp = await NOCApplication.findOne({
            status: { $in: ['PENDING_ENFORCEMENT_REVIEW', 'UNDER_REVIEW_ENFORCEMENT'] }
        });
        if (pendingApp) {
            data.pendingAppId = pendingApp._id;
        } else {
            // Fallback: any app if none pending (user will have to imagine status)
            const anyApp = await NOCApplication.findOne({ status: 'SUBMITTED' });
            if (anyApp) data.pendingAppId = anyApp._id;
        }

        // 3. Issued NOC (For Revoke, Compliance)
        const issuedApp = await NOCApplication.findOne({ status: 'NOC_ISSUED' });
        if (issuedApp) {
            data.issuedAppId = issuedApp._id;
            data.nocCertificateId = issuedApp.nocCertificateId; // Might need to fetch cert if not populated
            if (data.nocCertificateId) {
                const cert = await NOCCertificate.findById(data.nocCertificateId);
                if (cert) data.nocId = cert._id;
            }
        }

        // 4. Document (For Verification)
        if (pendingApp && pendingApp.documents && pendingApp.documents.length > 0) {
            data.documentId = pendingApp.documents[0]._id; // Accessing subdocument ID
        }

        console.log("\n--- ENFORCEMENT TEST DATA ---");
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

getEnforcementTestData();
