const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
// Use the existing IDs from the session context
const DOCUMENT_ID = 'b3199763-3191-4fa5-8b91-402322701baa';
const APPLICATION_ID = '95284192-40e2-4643-8cbe-cffaca7826bf';
const TOKEN = ""; // User token not strictly needed for this internal-ish endpoint depending on middleware, but let's assume we might need one. 
// Actually, looking at routes, it might be protected.
// Let's try to login as admin or the user first to get a token.

async function testAIVerification() {
    try {
        // 1. Login to get token (using the applicant user from context)
        console.log("Logging in...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: "applicant_test",
            email: "applicant@test.com",
            password: "password123"
        });
        const token = loginRes.data.data.token;
        console.log("Logged in. Token obtained.");

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 2. Call AI Verification Endpoint (PUBLIC - No Token)
        console.log(`Verifying Document ${DOCUMENT_ID} as TRUE (Verified)...`);
        const verifyRes = await axios.post(
            `${API_URL}/documents/${DOCUMENT_ID}/verify-ai`,
            { verified: true }
            // No config/auth header needed for this public endpoint
        );

        console.log("AI Verification Response:", verifyRes.status);
        console.log("Data:", JSON.stringify(verifyRes.data, null, 2));

        // 3. (Skipped) Fetching individual document metadata not directly available via API
        console.log("Skipping individual doc fetch (endpoint returns binary). Relying on previous response.");

        // 4. Verify the Application has the updated status (Embedded doc check)
        console.log(`Fetching Application ${APPLICATION_ID} documents to confirm sync...`);
        // Note: We need a user who can view this. The applicant should be able to.
        const appDocsRes = await axios.get(`${API_URL}/applications/noc/${APPLICATION_ID}/documents`, config);

        const appDocs = appDocsRes.data.data || appDocsRes.data; // adjust based on actual response structure
        // Find the specific document in the array
        const embeddedDoc = appDocs.find(d => d.documentId === DOCUMENT_ID);

        if (embeddedDoc) {
            console.log("Embedded Document Verification State:", JSON.stringify(embeddedDoc.verification, null, 2));
            if (embeddedDoc.verification?.ai?.verified === true) {
                console.log("SUCCESS: Application embedded document updated correctly.");
            } else {
                console.error("FAILURE: Application embedded document NOT updated.");
            }
        } else {
            console.error("FAILURE: Document not found in Application document list.");
        }

    } catch (error) {
        if (error.response) {
            console.error("Error Response:", error.response.status, error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
}

testAIVerification();
