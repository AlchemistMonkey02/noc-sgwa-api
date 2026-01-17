
const axios = require('axios');

async function checkServer() {
    try {
        console.log("Authenticating...");
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'dgo_admin',
            password: 'password123'
        });
        const token = loginRes.data.data.token;

        console.log("Probing verify-documents with Tracking ID on port 3000...");
        try {
            await axios.post('http://localhost:3000/api/officer/dgo/applications/REF-20260110-6106/verify-documents',
                { documents: [] },
                { headers: { Authorization: `Bearer ${token}` } });

            console.log("STATUS: SUCCESS (Route matches)");
        } catch (e) {
            if (e.response && e.response.status === 404) {
                console.log("STATUS: FAIL (404 Not Found - Server still stale)");
            } else {
                console.log(`STATUS: REACHABLE (Response: ${e.response ? e.response.status : e.message})`);
            }
        }
    } catch (e) {
        console.log("STATUS: ERROR (Could not connect/login)");
    }
}
checkServer();
