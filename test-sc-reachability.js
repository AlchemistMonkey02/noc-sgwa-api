
const axios = require('axios');
const mongoose = require('mongoose');

// We need a valid token and applicationId to test this.
// Ideally usage: node test-self-compliance.js <TOKEN> <APPLICATION_ID>
// If not provided, it might fail or we mock.

const BASE_URL = 'http://localhost:5000/api/self-compliance';

async function testSelfCompliance() {
    try {
        // 1. We effectively need a mock flow since we can't easily get a token interactively here without credentials.
        // However, I can check if the server responds 401, which confirms the route is active.

        console.log("Testing POST /start without token...");
        try {
            await axios.post(`${BASE_URL}/start`, {});
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log("SUCCESS: API is reachable and protected (Got 401 Unauthorized)");
            } else if (error.response && error.response.status === 404) {
                console.log("FAILURE: API route not found (404)");
            } else {
                console.log(`Response: ${error.response ? error.response.status : error.message}`);
            }
        }

    } catch (error) {
        console.error("Test failed:", error.message);
    }
}

testSelfCompliance();
