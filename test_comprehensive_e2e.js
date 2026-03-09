const mongoose = require('mongoose');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

async function testComprehensiveE2E() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✓ Connected to MongoDB");

        // Load models
        const User = require('./app/auth/user.model');
        const NOCApplication = require('./app/noc/noc-application.model');
        const ApplicationQuery = require('./app/noc/application-query.model');

        const nocService = require('./app/noc/noc.service');
        const dgoService = require('./app/officers/dgo/dgo.service');
        const sgwaService = require('./app/officers/sgwa/sgwa.service');
        const enforcementService = require('./app/officers/enforcement/enforcement.service');
        const inspectionService = require('./app/officers/inspection/inspection.service');

        // Identify Test Users (Ensure these exist in your DB or seed them)
        const applicant = await User.findOne({ userType: 'APPLICANT' });
        const dgo = await User.findOne({ userType: 'DGO' });
        const sgwa = await User.findOne({ userType: 'RSGWA' });
        const enforcement = await User.findOne({ userType: 'ENFORCEMENT' });
        const inspector = await User.findOne({ userType: 'INSPECTION_OFFICER' });

        if (!applicant || !dgo || !sgwa || !enforcement || !inspector) {
            console.error("✗ Missing test users! Please run seed-officers.js first.");
            process.exit(1);
        }

        const district = "JAIPUR";
        const blockId = "SANG";
        const uniqueSuffix = Date.now();

        console.log(`\n--- Test Context ---`);
        console.log(`Applicant: ${applicant.email}`);
        console.log(`DGO: ${dgo.email} (District: ${district})`);
        console.log(`SGWA: ${sgwa.email}`);
        console.log(`Enforcement: ${enforcement.email}`);
        console.log(`Inspector: ${inspector.email}`);

        // --- PHASE 1: SUBMISSION ---
        console.log("\n--- Phase 1: Applicant Submission ---");
        const appPayload = {
            applicationId: uuidv4(),
            applicationType: "New",
            category: "Industrial",
            projectDetails: {
                projectName: "E2E Comprehensive Project " + uniqueSuffix,
                applicantName: applicant.firstName + " " + applicant.lastName,
                organizationType: "Private",
                projectStatus: "New"
            },
            location: {
                districtId: district,
                blockId: blockId,
                address: "E2E Industrial Area",
                pincode: "302001"
            }
        };

        const draft = await nocService.createOrUpdateApplication(appPayload, applicant._id);
        console.log(`✓ Draft Created: ${draft.applicationId}`);

        const submitted = await nocService.submitApplication(draft.applicationId, applicant._id, 'APPLICANT');
        console.log(`✓ Application Submitted. Status: ${submitted.status}`);

        // --- PHASE 2: DGO QUERY ---
        console.log("\n--- Phase 2: DGO Scrutiny & Query ---");
        const queryData = {
            subject: "Missing Land Ownership Documents",
            query: "Please upload clear scanned copies of ownership documents.",
            description: "The uploaded files are blurry.",
            priority: "HIGH",
            responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        };
        const queryResult = await dgoService.raiseQuery(submitted.applicationId, dgo._id, queryData);
        console.log(`✓ Query Raised. QueryID: ${queryResult.query.queryId}`);

        // --- PHASE 3: APPLICANT RESPONSE ---
        console.log("\n--- Phase 3: Applicant Responding to Query ---");
        const responsePayload = "I have uploaded the clear copies now. Re-attached clear copies of land ownership documents.";
        const responded = await nocService.respondToQuery(queryResult.query.queryId, responsePayload, applicant._id);
        console.log(`✓ Query Responded. Status: ${responded.status}`);

        // --- PHASE 4: DGO INSPECTION SCHEDULING ---
        console.log("\n--- Phase 4: DGO Verification & Inspection Scheduling ---");
        // Verify response
        await dgoService.acceptQueryResponse(queryResult.query.queryId, dgo._id);
        console.log("✓ Query Response Accepted.");

        // Mark docs verified
        await dgoService.verifyDocuments(submitted.applicationId, dgo._id, {
            documents: [{ documentId: "doc1", status: "VERIFIED", remarks: "Clear as requested" }]
        });
        console.log("✓ Documents Verified.");

        // Schedule Inspection
        const inspectionSchedule = {
            inspectorId: inspector._id,
            scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            remarks: "Check site coordinates and borehole depth"
        };
        const scheduled = await dgoService.scheduleInspection(submitted.applicationId, dgo._id, inspectionSchedule);
        console.log(`✓ Inspection Scheduled. InspectionID: ${scheduled.inspection.inspectionId}`);

        // --- PHASE 5: INSPECTION REPORT ---
        console.log("\n--- Phase 5: Inspector Site Visit ---");
        // Start inspection
        await inspectionService.startInspection(scheduled.inspection.inspectionId, inspector._id, {
            lat: 26.9124,
            lng: 75.7873
        });
        console.log("✓ Inspection Started.");

        // Submit report
        const reportData = {
            findings: "Site matches application. Depth is 120m. Digital flow meter installed.",
            coordinates: { lat: 26.9124, lng: 75.7873 },
            photos: ["photo_link_1", "photo_link_2"]
        };
        await inspectionService.submitReport(scheduled.inspection.inspectionId, inspector._id, reportData);
        console.log("✓ Inspection Report Submitted.");

        // --- PHASE 6: DGO FORWARD TO SGWA ---
        console.log("\n--- Phase 6: DGO Recommendation ---");
        const recommendation = {
            remarks: "Inspection successful. All criteria met.",
            recommendation: "RECOMMEND_APPROVAL"
        };
        const forwarded = await dgoService.approveApplication(submitted.applicationId, dgo._id, recommendation);
        console.log(`✓ Recommended and Forwarded. Status: ${forwarded.status}`);

        // --- PHASE 7: SGWA TECHNICAL REVIEW ---
        console.log("\n--- Phase 7: SGWA Technical Review ---");
        // Assign to SGWA officer
        await sgwaService.assignApplication(submitted.applicationId, sgwa._id, { officerId: sgwa._id, remarks: "Reviewing technical parameters" });
        console.log("✓ Assigned to SGWA.");

        // Final SGWA approval
        const sgwaApproval = {
            remarks: "Water budget verified. Approved for 20 m3/day.",
            recommendation: "APPROVE",
            nocValidityYears: 2
        };
        const sgwaFinal = await sgwaService.approveApplication(submitted.applicationId, sgwa._id, sgwaApproval);
        console.log(`✓ SGWA Approved. Status: ${sgwaFinal.status}`);

        // --- PHASE 8: ENFORCEMENT ISSUANCE ---
        console.log("\n--- Phase 8: Enforcement Final Issuance ---");
        // Assign to enforcement
        await enforcementService.assignApplication(submitted.applicationId, enforcement._id, { officerId: enforcement._id, remarks: "Preparing final certificate" });
        console.log("✓ Assigned to Enforcement.");

        const finalNOC = await enforcementService.issueNOC(submitted.applicationId, enforcement._id, {
            remarks: "NOC Issued by Regional Office.",
            nocNumber: `SGWA/RAJ/NOC/${uniqueSuffix}`
        });
        console.log(`✓ NOC ISSUED! NOC Number: ${finalNOC.certificate.nocNumber}`);
        console.log(`✓ Final Application Status: ${finalNOC.application.status}`);

        console.log("\n🎯 COMPREHENSIVE E2E FLOW COMPLETED SUCCESSFULLY 🎯");
        process.exit(0);
    } catch (err) {
        console.error("\n✗ E2E Flow Failed!", err);
        process.exit(1);
    }
}

testComprehensiveE2E();
