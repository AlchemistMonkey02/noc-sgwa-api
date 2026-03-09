const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('./app/utils/logger');

// Load all models to prevent MissingSchemaError during population
const User = require('./app/auth/user.model');
const NOCApplication = require('./app/noc/noc-application.model');
const Company = require('./app/company/company.model');
const ApplicationQuery = require('./app/noc/application-query.model');
const NOCCertificate = require('./app/noc/noc-certificate.model');
const Violation = require('./app/officers/enforcement/violation.model');
const Complaint = require('./app/officers/enforcement/complaint.model');
async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const dgo = await User.findOne({ userType: 'DGO' });
        const sgwa = await User.findOne({ userType: 'RSGWA' }); // Matches DB value
        const enforcement = await User.findOne({ userType: 'ENFORCEMENT' });

        if (!dgo || !sgwa || !enforcement) {
            console.error("Required test users (DGO, SGWA, Enforcement) not found in DB.");
            process.exit(1);
        }

        console.log(`Testing with DGO: ${dgo.email} (District: ${dgo.communicationAddress?.district})`);
        console.log(`Testing with SGWA: ${sgwa.email}`);
        console.log(`Testing with Enforcement: ${enforcement.email}`);

        const dgoService = require('./app/officers/dgo/dgo.service');
        const sgwaService = require('./app/officers/sgwa/sgwa.service');
        const enforcementService = require('./app/officers/enforcement/enforcement.service');

        // 1. Test DGO Isolation
        const dgoApps = await dgoService.getApplications(dgo._id);
        console.log(`DGO Applications found: ${dgoApps.pagination.total}`);
        const invalidDGOApps = dgoApps.applications.filter(a =>
            a.location?.districtId?.toLowerCase() !== dgo.communicationAddress?.district?.toLowerCase()
        );
        if (invalidDGOApps.length > 0) {
            console.error("FAIL: DGO sees applications outside their district!", invalidDGOApps.map(a => a.location?.districtId));
        } else {
            console.log("PASS: DGO isolation verified.");
        }

        // 2. Test SGWA State-wide Access
        const sgwaApps = await sgwaService.getApplications(sgwa._id);
        console.log(`SGWA Applications found (Pool): ${sgwaApps.pagination.total}`);
        console.log("PASS: SGWA can access pooled applications.");

        // 3. Test Enforcement Assignment Isolation
        const enfApps = await enforcementService.getApplications(enforcement._id);
        console.log(`Enforcement Assigned Applications: ${enfApps.pagination.total}`);
        const invalidEnfApps = enfApps.applications.filter(a => String(a.assignedTo) !== String(enforcement._id));
        if (invalidEnfApps.length > 0) {
            console.error("FAIL: Enforcement sees applications not assigned to them!");
        } else {
            console.log("PASS: Enforcement assignment isolation verified.");
        }

        // 4. Test Enforcement Pool
        const enfPool = await enforcementService.getApprovalQueue(enforcement._id);
        console.log(`Enforcement Pool (Unassigned): ${enfPool.length}`);
        const invalidPoolApps = enfPool.filter(a => a.assignedTo !== null);
        if (invalidPoolApps.length > 0) {
            console.error("FAIL: Enforcement pool contains assigned applications!");
        } else {
            console.log("PASS: Enforcement pool isolation verified.");
        }

        process.exit(0);
    } catch (err) {
        console.error("Verification failed with error:", err);
        process.exit(1);
    }
}

verify();
