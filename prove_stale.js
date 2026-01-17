
const axios = require('axios');

async function probeServer() {
    try {
        console.log("Authenticating...");
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'dgo_admin',
            password: 'password123'
        });
        const token = loginRes.data.data.token;

        console.log("Probing /ping endpoint on port 3000...");
        try {
            const res = await axios.get('http://localhost:3000/api/officer/dgo/ping', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Response Data:", res.data);
            if (res.data.version === "v_probe_1") {
                console.log("RESULT: SERVER IS UPDATED (Probe matched)");
            } else {
                console.log("RESULT: SERVER IS STALE (Probe version mismatch)");
            }
        } catch (e) {
            console.log("RESULT: SERVER IS STALE (Ping Failed/404)");
            console.log("Error:", e.response ? e.response.status : e.message);
        }
    } catch (e) {
        console.log("Error logging in:", e.message);
    }
}
probeServer();
