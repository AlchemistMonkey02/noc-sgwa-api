const axios = require('axios');

async function getApplicantToken() {
    try {
        console.log("Logging in as applicant_test...");
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'applicant_test',
            password: 'password123'
        });

        if (response.data.success) {
            const token = response.data.data.token;
            console.log("\n--- SUCCESS: VALID APPLICANT TOKEN GENERATED ---");
            console.log("\nRun this EXACT command to download the certificate:");
            console.log(`\ncurl -X GET "http://localhost:5000/api/applications/noc/696385af85ba8d751b6f1d3a/certificate/download" -H "Authorization: Bearer ${token}" --output final_noc.pdf`);
        } else {
            console.log("Login failed:", response.data);
        }
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

getApplicantToken();
