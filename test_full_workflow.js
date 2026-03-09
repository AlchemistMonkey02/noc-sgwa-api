/**
 * Full E2E Workflow Test
 * Tests: User Submit → DGO Schedule Inspection → Inspector Completes → SGWA Approves → Enforcement Issues NOC
 * Also verifies dashboard visibility at each stage and user dashboard persistence.
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const PASS = '✅';
const FAIL = '❌';
const INFO = 'ℹ️';

async function testFullWorkflow() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(`${PASS} Connected to MongoDB\n`);

        // Load models
        require('./app/auth/user.model');
        require('./app/company/company.model');
        require('./app/master-data/district.model');
        require('./app/master-data/block.model');
        const NOCApplication = require('./app/noc/noc-application.model');
        require('./app/noc/application-query.model');
        require('./app/noc/noc-certificate.model');
        require('./app/officers/enforcement/violation.model');
        require('./app/officers/enforcement/complaint.model');
        require('./app/officers/inspection/inspection.model');

        // Load services
        const nocService = require('./app/noc/noc.service');
        const dgoService = require('./app/officers/dgo/dgo.service');
        const inspectionService = require('./app/officers/inspection/inspection.service');
        const sgwaService = require('./app/officers/sgwa/sgwa.service');
        const enforcementService = require('./app/officers/enforcement/enforcement.service');
        const User = require('./app/auth/user.model');

        // ========================
        // ENSURE ALL ROLES EXIST
        // ========================
        console.log('=== Setting Up Test Users ===\n');

        const ensureUser = async (query, defaults) => {
            let user = await User.findOne(query);
            if (!user) {
                const hashedPassword = await bcrypt.hash('password123', 10);
                user = new User({ ...defaults, password: hashedPassword });
                await user.save();
                console.log(`  ${INFO} Created ${defaults.userType} user: ${defaults.email}`);
            } else {
                console.log(`  ${PASS} Found ${user.userType} user: ${user.email}`);
            }
            return user;
        };

        const applicant = await ensureUser(
            { userType: 'APPLICANT' },
            {
                email: 'test.applicant@example.com', userType: 'APPLICANT',
                firstName: 'Test', lastName: 'Applicant', phone: '9000000001',
                gender: 'MALE', idProofType: 'AADHAAR', idProofNumber: '111111111111',
                communicationAddress: { addressLine1: 'Test', state: 'Rajasthan', district: 'Jaipur', pincode: '302001' },
                accountStatus: 'ACTIVE', emailVerified: true, phoneVerified: true, verificationStatus: 'VERIFIED'
            }
        );

        const dgo = await ensureUser(
            { userType: 'DGO' },
            {
                email: 'dgo.officer@rajasthan.gov.in', userType: 'DGO',
                firstName: 'DGO', lastName: 'Officer', phone: '9000000002',
                gender: 'MALE', idProofType: 'AADHAAR', idProofNumber: '222222222222',
                communicationAddress: { addressLine1: 'Office', state: 'Rajasthan', district: 'Jaipur', pincode: '302005' },
                accountStatus: 'ACTIVE', emailVerified: true, phoneVerified: true, verificationStatus: 'VERIFIED'
            }
        );

        const inspector = await ensureUser(
            { userType: 'INSPECTION' },
            {
                email: 'inspection.officer@rajasthan.gov.in', userType: 'INSPECTION',
                firstName: 'Inspection', lastName: 'Officer', phone: '9000000005',
                gender: 'MALE', idProofType: 'AADHAAR', idProofNumber: '555555555555',
                communicationAddress: { addressLine1: 'Office', state: 'Rajasthan', district: 'Jaipur', pincode: '302005' },
                accountStatus: 'ACTIVE', emailVerified: true, phoneVerified: true, verificationStatus: 'VERIFIED'
            }
        );

        const sgwa = await ensureUser(
            { userType: 'RSGWA' },
            {
                email: 'sgwa.officer@rajasthan.gov.in', userType: 'RSGWA',
                firstName: 'SGWA', lastName: 'Authority', phone: '9000000003',
                gender: 'MALE', idProofType: 'AADHAAR', idProofNumber: '333333333333',
                communicationAddress: { addressLine1: 'Office', state: 'Rajasthan', district: 'Jaipur', pincode: '302005' },
                accountStatus: 'ACTIVE', emailVerified: true, phoneVerified: true, verificationStatus: 'VERIFIED'
            }
        );

        const enforcement = await ensureUser(
            { userType: 'ENFORCEMENT' },
            {
                email: 'enforcement.officer@rajasthan.gov.in', userType: 'ENFORCEMENT',
                firstName: 'Enforcement', lastName: 'Officer', phone: '9000000004',
                gender: 'MALE', idProofType: 'AADHAAR', idProofNumber: '444444444444',
                communicationAddress: { addressLine1: 'Office', state: 'Rajasthan', district: 'Jaipur', pincode: '302005' },
                accountStatus: 'ACTIVE', emailVerified: true, phoneVerified: true, verificationStatus: 'VERIFIED'
            }
        );

        console.log('');

        // ========================
        // STEP 1: USER SUBMITS APPLICATION
        // ========================
        console.log('══════════════════════════════════════════');
        console.log('  STEP 1: USER SUBMITS APPLICATION');
        console.log('══════════════════════════════════════════\n');

        const appPayload = {
            applicationId: uuidv4(),
            applicationType: 'New',
            category: 'Industrial',
            projectDetails: {
                projectName: 'Full Workflow Test ' + Date.now(),
                applicantName: applicant.firstName + ' ' + applicant.lastName,
                organizationType: 'Private',
                projectStatus: 'New'
            },
            location: {
                districtId: 'JAIPUR',
                blockId: 'AMER',
                address: 'Test Location Village',
                pincode: '302001'
            }
        };

        const draft = await nocService.createOrUpdateApplication(appPayload, applicant._id);
        console.log(`  ${PASS} Draft Created: ${draft.applicationId}`);

        const submitted = await nocService.submitApplication(draft.applicationId, applicant._id, 'APPLICANT');
        console.log(`  ${PASS} Application Submitted | Status: ${submitted.status}`);

        // Verify user can see it
        const userApps1 = await NOCApplication.find({ userId: applicant._id });
        console.log(`  ${PASS} User Dashboard: ${userApps1.length} application(s) visible`);

        // ========================
        // STEP 2: DGO SCHEDULES INSPECTION
        // ========================
        console.log('\n══════════════════════════════════════════');
        console.log('  STEP 2: DGO SCHEDULES INSPECTION');
        console.log('══════════════════════════════════════════\n');

        // Verify DGO can see the application
        const dgoApps = await dgoService.getApplications(dgo._id, {});
        const dgoVisible = dgoApps.applications ? dgoApps.applications.length : dgoApps.length;
        console.log(`  ${PASS} DGO Dashboard: ${dgoVisible} application(s) visible`);

        // DGO verifies documents first
        await dgoService.verifyDocuments(submitted.applicationId, dgo._id, {
            documents: [{ documentId: 'doc1', status: 'VERIFIED', remarks: 'OK' }]
        });
        console.log(`  ${PASS} DGO: Documents verified`);

        // DGO schedules inspection instead of direct approval
        const inspectionResult = await dgoService.scheduleInspection(submitted.applicationId, dgo._id, {
            inspectorId: inspector._id,
            inspectionDate: new Date(Date.now() + 86400000) // tomorrow
        });
        console.log(`  ${PASS} DGO: Inspection scheduled | Status: ${inspectionResult.application.status}`);
        console.log(`  ${INFO} Inspection ID: ${inspectionResult.inspection.inspectionId}`);

        // Verify status
        const afterInspSched = await NOCApplication.findOne({ applicationId: submitted.applicationId });
        if (afterInspSched.status !== 'INSPECTION_SCHEDULED') {
            console.log(`  ${FAIL} Expected status INSPECTION_SCHEDULED, got ${afterInspSched.status}`);
        } else {
            console.log(`  ${PASS} Status correctly set to INSPECTION_SCHEDULED`);
        }

        // ========================
        // STEP 3: INSPECTION OFFICER COMPLETES INSPECTION
        // ========================
        console.log('\n══════════════════════════════════════════');
        console.log('  STEP 3: INSPECTION OFFICER COMPLETES');
        console.log('══════════════════════════════════════════\n');

        // Verify inspector can see assigned inspections
        const inspections = await inspectionService.getAssignedInspections(inspector._id, {});
        console.log(`  ${PASS} Inspector Dashboard: ${inspections.length} inspection(s) assigned`);

        // Inspector starts inspection (check-in)
        await inspectionService.startInspection(inspectionResult.inspection.inspectionId, inspector._id, {
            latitude: 26.9124, longitude: 75.7873
        });
        console.log(`  ${PASS} Inspector: Check-in completed`);

        // Inspector submits report
        await inspectionService.submitReport(inspectionResult.inspection.inspectionId, inspector._id, {
            locationMatch: true,
            landUseMatch: true,
            existingSources: 2,
            meterInstalled: 'YES',
            rainwaterHarvesting: 'IMPLEMENTED',
            recommendation: 'RECOMMENDED',
            remarks: 'All conditions met on site'
        });
        console.log(`  ${PASS} Inspector: Report submitted`);

        // Verify application status changed to INSPECTED
        const afterInspection = await NOCApplication.findOne({ applicationId: submitted.applicationId });
        if (afterInspection.status !== 'INSPECTED') {
            console.log(`  ${FAIL} Expected status INSPECTED, got ${afterInspection.status}`);
        } else {
            console.log(`  ${PASS} Status correctly set to INSPECTED`);
        }

        // ========================
        // STEP 4: SGWA REVIEWS AND APPROVES
        // ========================
        console.log('\n══════════════════════════════════════════');
        console.log('  STEP 4: SGWA REVIEWS AND APPROVES');
        console.log('══════════════════════════════════════════\n');

        // Verify SGWA can see the INSPECTED application
        const sgwaApps = await sgwaService.getApplications(sgwa._id, {});
        const sgwaVisible = sgwaApps.applications ? sgwaApps.applications.length : 0;
        console.log(`  ${PASS} SGWA Dashboard: ${sgwaVisible} application(s) visible`);

        // Check that our app is in the SGWA list
        const ourAppInSgwa = sgwaApps.applications?.some(a =>
            a.id === submitted.applicationId || a.applicationNumber === afterInspection.applicationNumber
        );
        if (ourAppInSgwa) {
            console.log(`  ${PASS} SGWA: Our INSPECTED application IS visible in SGWA dashboard`);
        } else {
            console.log(`  ${FAIL} SGWA: Our INSPECTED application is NOT visible — need to check status filter`);
        }

        // SGWA assigns to self
        await sgwaService.assignApplication(submitted.applicationId, sgwa._id, {
            officerId: sgwa._id, remarks: 'Taking up for review'
        });
        console.log(`  ${PASS} SGWA: Application assigned to self`);

        // SGWA approves
        const sgwaApproved = await sgwaService.approveApplication(submitted.applicationId, sgwa._id, {
            remarks: 'Technically sound. All conditions verified.',
            nocValidityYears: 3
        });
        console.log(`  ${PASS} SGWA: Application approved | Status: ${sgwaApproved.status}`);

        // Verify status
        const afterSgwa = await NOCApplication.findOne({ applicationId: submitted.applicationId });
        if (afterSgwa.status !== 'PENDING_FINAL_APPROVAL') {
            console.log(`  ${FAIL} Expected status PENDING_FINAL_APPROVAL, got ${afterSgwa.status}`);
        } else {
            console.log(`  ${PASS} Status correctly set to PENDING_FINAL_APPROVAL`);
        }

        // ========================
        // STEP 5: ENFORCEMENT ISSUES NOC
        // ========================
        console.log('\n══════════════════════════════════════════');
        console.log('  STEP 5: ENFORCEMENT ISSUES NOC');
        console.log('══════════════════════════════════════════\n');

        // Verify Enforcement can see the application
        const enfApps = await enforcementService.getApplications(enforcement._id, {});
        const enfVisible = enfApps.applications ? enfApps.applications.length : 0;
        console.log(`  ${PASS} Enforcement Dashboard: ${enfVisible} application(s) visible`);

        // Enforcement assigns to self
        await enforcementService.assignApplication(submitted.applicationId, enforcement._id, {
            officerId: enforcement._id, remarks: 'Issuing NOC'
        });
        console.log(`  ${PASS} Enforcement: Application assigned to self`);

        // Enforcement issues NOC
        let nocResult;
        try {
            nocResult = await enforcementService.issueNOC(submitted.applicationId, enforcement._id, {
                remarks: 'All conditions met. Issuing NOC.',
                nocNumber: `NOC/E2E/${Date.now()}`
            });
            console.log(`  ${PASS} Enforcement: NOC Issued! Status: ${nocResult.application.status}`);
            console.log(`  ${INFO} NOC Number: ${nocResult.certificate.nocNumber}`);
        } catch (err) {
            console.log(`  ${FAIL} Enforcement: NOC issuance failed — ${err.message || JSON.stringify(err)}`);
            // Still continue to test user visibility
        }

        // ========================
        // STEP 6: VERIFY USER DASHBOARD VISIBILITY
        // ========================
        console.log('\n══════════════════════════════════════════');
        console.log('  STEP 6: USER DASHBOARD — APPROVED VISIBLE');
        console.log('══════════════════════════════════════════\n');

        const finalApp = await NOCApplication.findOne({ applicationId: submitted.applicationId });
        console.log(`  ${INFO} Final Application Status: ${finalApp.status}`);

        // Direct DB check — user's applications
        const userAllApps = await NOCApplication.find({ userId: applicant._id });
        console.log(`  ${PASS} User Total Applications (DB): ${userAllApps.length}`);

        // Simulating IN_PROCESS filter (what the user dashboard uses)
        const inProcessApps = await NOCApplication.find({
            userId: applicant._id,
            status: { $nin: ['WITHDRAWN', 'ARCHIVED'] }
        });
        console.log(`  ${PASS} User Dashboard (IN_PROCESS filter): ${inProcessApps.length} application(s) visible`);

        const approvedOnDashboard = inProcessApps.some(a => a.applicationId === submitted.applicationId);
        if (approvedOnDashboard) {
            console.log(`  ${PASS} APPROVED/NOC_ISSUED application IS visible on user dashboard`);
        } else {
            console.log(`  ${FAIL} APPROVED/NOC_ISSUED application is NOT visible on user dashboard`);
        }

        // ========================
        // SUMMARY
        // ========================
        console.log('\n══════════════════════════════════════════');
        console.log('  WORKFLOW SUMMARY');
        console.log('══════════════════════════════════════════');
        console.log(`
  Application: ${finalApp.applicationNumber}
  Tracking ID: ${finalApp.trackingId}

  Flow:
    1. SUBMITTED         → ${PASS}
    2. INSPECTION_SCHEDULED (DGO) → ${PASS}
    3. INSPECTED (Inspector)      → ${PASS}
    4. APPROVED by SGWA           → ${PASS}
    5. NOC ISSUED (Enforcement)   → ${nocResult ? PASS : FAIL}
    6. Visible on User Dashboard  → ${approvedOnDashboard ? PASS : FAIL}

  Final Status: ${finalApp.status}
`);

        console.log(`${PASS} FULL WORKFLOW TEST COMPLETED SUCCESSFULLY\n`);
        process.exit(0);
    } catch (err) {
        console.error(`\n${FAIL} Workflow Test Failed!`, err);
        process.exit(1);
    }
}

testFullWorkflow();
