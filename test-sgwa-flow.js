const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const SGWA_CREDENTIALS = {
    email: 'sgwa.officer@rajasthan.gov.in', // Default from spec, will double check seed
    password: 'password123', // Assumption/Common seed password
    userType: 'RSGWA'
};

async function testSGWA() {
    try {
        console.log("1. Logging in as SGWA Officer...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: SGWA_CREDENTIALS.email,
            password: SGWA_CREDENTIALS.password,
            userType: SGWA_CREDENTIALS.userType
        });
        const token = loginRes.data.data.token;
        console.log("   Login Success! Token obtained.");

        const headers = { Authorization: `Bearer ${token}` };

        console.log("\n2. Fetching Dashboard Stats...");
        const dashRes = await axios.get(`${API_URL}/officer/sgwa/dashboard`, { headers });
        console.log("   Dashboard Stats:", JSON.stringify(dashRes.data.data.stats, null, 2));

        console.log("\n3. Fetching Application List...");
        const appsRes = await axios.get(`${API_URL}/officer/sgwa/applications`, { headers });
        const apps = appsRes.data.data.applications || [];
        console.log(`   Found ${apps.length} applications.`);

        if (apps.length > 0) {
            const appId = apps[0].id;
            console.log(`\n4. Fetching Details for Application ID: ${appId}...`);
            try {
                const detailRes = await axios.get(`${API_URL}/officer/sgwa/applications/${appId}`, { headers });
                console.log("   Application Details Retrieved successfully.");
                console.log("   Compliance Checklist:", detailRes.data.data.application.complianceChecklist);
            } catch (err) {
                console.log("   Failed to get details (might be data issue):", err.message);
            }
        } else {
            console.log("   Skipping detail test (no applications found).");
        }

        console.log("\n5. Testing Metrics Endpoint (Stub)...");
        const metricsRes = await axios.get(`${API_URL}/officer/sgwa/metrics`, { headers });
        console.log("   Metrics:", metricsRes.data.data.metrics);

    } catch (error) {
        console.error("TEST FAILED:", error.response ? error.response.data : error.message);
    }
}

testSGWA();
