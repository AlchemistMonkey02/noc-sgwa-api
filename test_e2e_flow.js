const mongoose = require('mongoose');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

async function testE2E() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Load all models
        require('./app/auth/user.model');
        require('./app/company/company.model');
        require('./app/master-data/district.model');
        require('./app/master-data/block.model');
        const NOCApplication = require('./app/noc/noc-application.model');
        require('./app/noc/application-query.model');
        require('./app/noc/noc-certificate.model');
        require('./app/officers/enforcement/violation.model');
        require('./app/officers/enforcement/complaint.model');

        const nocService = require('./app/noc/noc.service');
        const dgoService = require('./app/officers/dgo/dgo.service');
        const sgwaService = require('./app/officers/sgwa/sgwa.service');
        const enforcementService = require('./app/officers/enforcement/enforcement.service');
        const User = require('./app/auth/user.model');

        // Identify Test Users
        const applicant = await User.findOne({ userType: 'APPLICANT' });
        const dgo = await User.findOne({ userType: 'DGO' });
        const sgwa = await User.findOne({ userType: 'RSGWA' });
        const enforcement = await User.findOne({ userType: 'ENFORCEMENT' });

        if (!applicant || !dgo || !sgwa || !enforcement) {
            console.error("Missing test users!");
            process.exit(1);
        }

        const district = "JAIPUR";
        const blockId = "SANG";
        console.log(`Using Applicant: ${applicant.email}`);
        console.log(`Using DGO: ${dgo.email} (District: ${district})`);
        console.log(`Using SGWA: ${sgwa.email}`);
        console.log(`Using Enforcement: ${enforcement.email}`);

        // --- STEP 1: SUBMISSION ---
        console.log("\n--- Step 1: Submitting Application ---");
        const appPayload = {
            applicationId: uuidv4(),
            applicationType: "New",
            category: "Industrial",
            projectDetails: {
                projectName: "E2E Test Project " + Date.now(),
                applicantName: applicant.firstName + " " + applicant.lastName,
                organizationType: "Private",
                projectStatus: "New"
            },
            location: {
                districtId: district,
                blockId: blockId,
                address: "Test Location",
                pincode: "302001"
            }
        };

        const draft = await nocService.createOrUpdateApplication(appPayload, applicant._id);
        console.log(`Draft Created: ${draft.applicationId} - Tracking: ${draft.trackingId}`);

        const submitted = await nocService.submitApplication(draft.applicationId, applicant._id, 'APPLICANT');
        console.log(`Application Submitted. Status: ${submitted.status}`);

        // --- STEP 2: DGO APPROVAL ---
        console.log("\n--- Step 2: DGO Scrutiny ---");
        const verified = await dgoService.verifyDocuments(submitted.applicationId, dgo._id, {
            documents: [{ documentId: "doc1", status: "VERIFIED", remarks: "OK" }]
        });
        console.log("Documents Verified.");

        const dgoApproved = await dgoService.approveApplication(submitted.applicationId, dgo._id, {
            remarks: "Recommended by DGO",
            recommendation: "RECOMMEND_APPROVAL"
        });
        console.log(`DGO Approved. Status: ${dgoApproved.status} - AssignedTo: ${dgoApproved.assignedTo || 'None (Pool)'}`);

        // --- STEP 3: SGWA APPROVAL ---
        console.log("\n--- Step 3: SGWA Review ---");
        // Assign to self
        await sgwaService.assignApplication(submitted.applicationId, sgwa._id, { officerId: sgwa._id, remarks: "Taking up for review" });
        console.log("Assigned to SGWA Officer.");

        const sgwaApproved = await sgwaService.approveApplication(submitted.applicationId, sgwa._id, {
            remarks: "Technically sound",
            nocValidityYears: 3
        });
        console.log(`SGWA Approved. Status: ${sgwaApproved.status} - AssignedTo: ${sgwaApproved.assignedTo || 'None (Pool)'}`);

        // --- STEP 4: ENFORCEMENT ISSUANCE ---
        console.log("\n--- Step 4: Enforcement Issuance ---");
        // Assign to self
        await enforcementService.assignApplication(submitted.applicationId, enforcement._id, { officerId: enforcement._id, remarks: "Issuing NOC" });
        console.log("Assigned to Enforcement Officer.");

        const result = await enforcementService.issueNOC(submitted.applicationId, enforcement._id, {
            remarks: "All conditions met. Issuing NOC.",
            nocNumber: `NOC/E2E/${Date.now()}`
        });
        console.log(`NOC Issued! Status: ${result.application.status}`);
        console.log(`NOC Number: ${result.certificate.nocNumber}`);

        console.log("\n✅ E2E FLOW COMPLETED SUCCESSFULLY");
        process.exit(0);
    } catch (err) {
        console.error("E2E Flow Failed!", err);
        process.exit(1);
    }
}

testE2E();
