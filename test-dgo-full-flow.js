const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let dgoToken = '';
let applicationId = '';

async function loginDGO() {
    try {
        console.log('Logging in as DGO...');
        // Using credentials from seed-officers.js
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'dgo_admin',
            password: 'password123'
        });
        dgoToken = res.data.data.token; // Adjusted based on common response structure { success: true, data: { token: ... } }
        console.log('Logged in successfully. Token obtained.');
        return true;
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        return false;
    }
}

async function testDashboard() {
    console.log('\nTesting Dashboard...');
    try {
        const res = await axios.get(`${BASE_URL}/officer/dgo/dashboard`, {
            headers: { Authorization: `Bearer ${dgoToken}` }
        });
        console.log('Dashboard Stats:', res.data.data);
    } catch (error) {
        console.error('Dashboard test failed:', error.response?.data || error.message);
    }
}

async function testApplicationList() {
    console.log('\nTesting Application List...');
    try {
        const res = await axios.get(`${BASE_URL}/officer/dgo/applications`, {
            headers: { Authorization: `Bearer ${dgoToken}` }
        });
        const apps = res.data.data;
        console.log(`Found ${apps.length} applications.`);
        if (apps.length > 0) {
            applicationId = apps[0].applicationId;
            console.log('Selected Application ID:', applicationId);
        }
        return apps.length > 0;
    } catch (error) {
        console.error('Application list test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testApplicationDetails() {
    if (!applicationId) return;
    console.log('\nTesting Application Details...');
    try {
        const res = await axios.get(`${BASE_URL}/officer/dgo/applications/${applicationId}`, {
            headers: { Authorization: `Bearer ${dgoToken}` }
        });
        console.log('Application Details fetched successfully.');
    } catch (error) {
        console.error('Application details test failed:', error.response?.data || error.message);
    }
}

async function testVerifyDocuments() {
    // OVERRIDE with specific ID from user's DB for verification
    applicationId = "5a2646fa-324f-45dc-88b8-5097e03d3b85";
    console.log('\nTesting Verify Documents...');
    try {
        const res = await axios.post(`${BASE_URL}/officer/dgo/applications/${applicationId}/verify-documents`, {
            documents: [
                { documentId: "doc_aadhar_1768047930902", status: "ACCEPTED", remarks: "Verified OK" }
            ]
        }, {
            headers: { Authorization: `Bearer ${dgoToken}` }
        });
        console.log('Documents verified:', res.data.message);
    } catch (error) {
        console.error('Verify documents test failed:', error.response?.data || error.message);
    }
}

async function testQueryManagement() {
    if (!applicationId) return;
    console.log('\nTesting Raise Query...');
    try {
        const res = await axios.post(`${BASE_URL}/officer/dgo/applications/${applicationId}/query`, {
            subject: "Clarification Needed", // Changed from queryTitle
            query: "Please explain the water usage.", // Changed from description
            description: "Please explain the water usage.", // Keeping both for compatibility if needed
            priority: "HIGH",
            responseDeadline: "2026-03-01"
        }, {
            headers: { Authorization: `Bearer ${dgoToken}` }
        });
        console.log('Query raised:', res.data.message);

        console.log('\nTesting List Queries...');
        const listRes = await axios.get(`${BASE_URL}/officer/dgo/queries`, {
            headers: { Authorization: `Bearer ${dgoToken}` }
        });
        console.log(`Found ${listRes.data.data.length} queries.`);

    } catch (error) {
        console.error('Query management test failed:', error.response?.data || error.message);
    }
}

async function runTests() {
    if (await loginDGO()) {
        await testDashboard();
        if (await testApplicationList()) {
            await testApplicationDetails();
            await testVerifyDocuments();
            await testQueryManagement();
        } else {
            console.log('No applications found to test detailed endpoints.');
        }
    }
}

runTests();
