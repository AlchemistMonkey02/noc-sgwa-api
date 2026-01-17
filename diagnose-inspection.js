
const { spawn } = require('child_process');
const axios = require('axios');

// 1. Start Server on Port 3004
console.log("Starting diagnostic server on PORT 3004...");
const server = spawn('node', ['index.js'], {
    env: { ...process.env, PORT: '3004', MONGO_URI: 'mongodb://localhost:27017/sgwa_db' },
    cwd: process.cwd(),
    shell: true
});

server.stdout.on('data', (data) => console.log(`[Server]: ${data}`));
server.stderr.on('data', (data) => console.error(`[Server Error]: ${data}`));

// 2. Wait and Test
async function runDiagnostic() {
    console.log("Waiting 8s for server to start...");
    await new Promise(r => setTimeout(r, 8000));

    try {
        console.log("Attempting Login...");
        const loginRes = await axios.post('http://localhost:3004/api/auth/login', {
            username: 'dgo_admin',
            password: 'password123'
        });
        const token = loginRes.data.data.token;
        console.log("Login Successful.");

        // Schedule Inspection using Tracking ID
        const trackingId = "REF-20260110-6106";
        console.log(`Testing schedule-inspection for Tracking ID: ${trackingId}`);

        try {
            const res = await axios.post(`http://localhost:3004/api/officer/dgo/applications/${trackingId}/schedule-inspection`, {
                inspectionDate: "2026-03-01"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("SUCCESS: Inspection Scheduled.", res.data);
        } catch (e) {
            console.error("FAILED:", e.response ? e.response.status : e.message);
            if (e.response) console.error("Error Body:", JSON.stringify(e.response.data, null, 2));
        }

    } catch (error) {
        console.error("Diagnostic Failed:", error.message);
    } finally {
        console.log("Killing diagnostic server...");
        spawn("taskkill", ["/pid", server.pid, "/f", "/t"]);
        setTimeout(() => process.exit(0), 1000);
    }
}

runDiagnostic();
