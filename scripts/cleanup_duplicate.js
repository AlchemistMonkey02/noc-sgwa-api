require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('../app/config/db.config');
const NOCCertificate = require('../app/noc/noc-certificate.model');
const NOCApplication = require('../app/noc/noc-application.model');

async function cleanupDuplicate() {
    try {
        await mongoose.connect(dbConfig.url);

        const duplicateNocId = "RJ/CGWA/NOC/2026/000005";
        const appId = "696385af85ba8d751b6f1d3a";

        console.log(`Cleaning up duplicate NOC: ${duplicateNocId}...`);

        // 1. Delete the conflicting certificate
        const deletedCert = await NOCCertificate.findOneAndDelete({ nocId: duplicateNocId });
        if (deletedCert) {
            console.log("Deleted orphaned certificate:", deletedCert._id);
        } else {
            console.log("No conflicting certificate found under that ID.");
        }

        // 2. Reset the Application status to ensure a clean 'Issue' attempt
        // If the application was partially updated or stuck, we reset it.
        const appUpdate = await NOCApplication.findByIdAndUpdate(
            appId,
            {
                status: 'PENDING_ENFORCEMENT_REVIEW', // Reset status
                $unset: { nocCertificateId: 1, "approvalFlow.enforcement": 1 } // Remove logic traces
            },
            { new: true }
        );

        if (appUpdate) {
            console.log("Reset application status to PENDING_ENFORCEMENT_REVIEW.");
        } else {
            console.log("Application not found to reset.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

cleanupDuplicate();
