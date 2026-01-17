const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function generateCurl() {
    try {
        // 1. Login
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'dgo_admin',
            password: 'password123'
        });
        const token = loginRes.data.data.token;

        // 2. Get Applications
        const appsRes = await axios.get(`${BASE_URL}/officer/dgo/applications`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const apps = appsRes.data.data;
        if (!apps || apps.length === 0) {
            console.log("No applications found in the database.");
            return;
        }

        const app = apps[0];
        const appId = app.applicationId || app._id; // Handle both id formats if needed

        // 3. Get Application Details to find a document ID
        const detailRes = await axios.get(`${BASE_URL}/officer/dgo/applications/${appId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const fullApp = detailRes.data.data;
        const docs = fullApp.documents;

        let docId = "DOC_ID_PLACEHOLDER";
        if (docs && docs.length > 0) {
            docId = docs[0].documentId || docs[0]._id;
        }

        // 4. Construct cURL
        const curlCommand = `curl -X POST "http://localhost:3000/api/officer/dgo/applications/${appId}/verify-documents" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "documents": [
        { "documentId": "${docId}", "status": "ACCEPTED", "remarks": "Verified by Officer" }
    ]
  }'`;

        console.log("\nHere is a valid cURL command for your current database:\n");
        console.log(curlCommand);

    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

generateCurl();
