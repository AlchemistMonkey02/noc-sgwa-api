const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

async function testAppUpload() {
    try {
        // 1. Login
        console.log("Logging in...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'applicant_test',
            password: 'password123'
        });
        const token = loginRes.data.data.token;
        console.log("Logged in. Token:", token.substring(0, 10) + "...");

        // 2. Create Application
        console.log("\nCreating Draft Application...");
        const appRes = await axios.post(`${API_URL}/applications/noc`, {
            projectType: "NEW",
            appliedFor: "IND"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const applicationId = appRes.data.data.applicationId;
        console.log("Application Created:", applicationId);

        // 3. Upload Document WITH Application ID
        console.log("\nUploading Document linked to Application...");

        // Create a dummy file
        const dummyPath = path.join(__dirname, 'test_app_doc.txt');
        fs.writeFileSync(dummyPath, 'This is a test document linked to an application.');

        const form = new FormData();
        form.append('files', fs.createReadStream(dummyPath));
        form.append('documentType', 'OTHER');
        form.append('applicationId', applicationId); // <--- KEY CHANGE

        const uploadRes = await axios.post(`${API_URL}/documents/upload`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Upload Response:", JSON.stringify(uploadRes.data, null, 2));

        const uploadedDoc = uploadRes.data.data[0];
        if (uploadedDoc.applicationId || uploadedDoc.companyId) { // companyId might be auto-linked too
            // Check if the service returns applicationId in response (it might not default return it in strict verification, but we check)
            console.log("Checking Linkage...");
        }

        // 4. Verify by Fetching Document
        console.log("\nVerifying Document Details...");
        const docRes = await axios.get(`${API_URL}/documents/${uploadedDoc.documentId}/view`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // We can't easily check metadata from view, so let's use the Get Application Documents endpoint
        console.log("\nFetching Application Documents...");
        const appDocsRes = await axios.get(`${API_URL}/applications/noc/${applicationId}/documents`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const linkedDoc = appDocsRes.data.data.find(d => d.documentId === uploadedDoc.documentId);

        if (linkedDoc) {
            console.log("\nSUCCESS: Document successfully linked to application!");
            console.log("Linked Document:", linkedDoc);
        } else {
            console.error("\nFAILURE: Document NOT found in application documents list.");
        }

        // Cleanup
        fs.unlinkSync(dummyPath);

    } catch (error) {
        console.error("Test Failed:", error);
        if (error.response) {
            console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
            console.error("Response Status:", error.response.status);
        }
    }
}

testAppUpload();
