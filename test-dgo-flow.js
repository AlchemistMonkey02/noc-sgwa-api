const axios = require('axios');


const BASE_URL = 'http://localhost:3000/api';

async function testPing() {
    try {
        const res = await axios.get(`${BASE_URL}/officer/dgo/ping`);
        console.log("Ping result:", res.data);
    } catch (e) {
        console.log("Ping failed:", e.message);
        console.log("Details:", e.response ? e.response.data : "");
    }
}
testPing();

const DGO_CREDENTIALS = {
    username: 'dgo.officer@rajasthan.gov.in', // Validator expects 'username' field (which can be email)
    password: 'password123',
    userType: 'DGO' // Validator uses userType, not role
};

async function runTest() {
    try {
        console.log("1. Logging in as DGO...");
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, DGO_CREDENTIALS);
        const token = loginRes.data.data.token;
        console.log("   Login Successful. Token received.");

        console.log("\n1a. Fetching Dashboard Stats...");
        try {
            const dashRes = await axios.get(`${BASE_URL}/officer/dgo/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("    Dashboard stats:", dashRes.data);
        } catch (e) { console.log("    Dashboard failed:", e.message); }

        console.log("\n2. Fetching DGO Applications...");
        const appRes = await axios.get(`${BASE_URL}/officer/dgo/applications`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const apps = appRes.data.data;
        console.log(`   Found ${apps.length} applications.`);

        if (apps.length === 0) {
            console.log("   No applications found. Please submit an application first.");
            return;
        }

        // Process first application
        const app = apps[0];
        // The controller expects the formatted ID (based on behavior), usually 'applicationNumber' or 'applicationId'
        const idToUse = app.applicationId || app.applicationNumber || app._id;
        console.log(`\n3. Processing Application: ${app.applicationNumber} (Using ID: ${idToUse})`);

        // Fetch full details to get documents if list view doesn't have them
        const detailRes = await axios.get(`${BASE_URL}/officer/dgo/applications/${idToUse}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const fullApp = detailRes.data.data;

        console.log("\n4. Document Links:");
        if (!fullApp.documents || fullApp.documents.length === 0) {
            console.log("   No documents uploaded for this application.");
        } else {
            fullApp.documents.forEach(doc => {
                const docType = doc.documentType || 'OTHER';
                const appId = fullApp.applicationNumber || fullApp._id; // Using App Number for prettier URLs if supported, or ID

                // Using the specific App ID + Doc Type endpoint
                const viewUrl = `${BASE_URL}/officer/common/applications/${appId}/documents/${docType}/view`;
                const downloadUrl = `${BASE_URL}/officer/common/applications/${appId}/documents/${docType}/download`;

                console.log(`   [${docType}]`);
                console.log(`     View:     ${viewUrl}`);
                console.log(`     Download: ${downloadUrl}`);
            });
        }

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

runTest();
