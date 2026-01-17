const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

// Load Routes
const sgwaRoutes = require('./app/officers/sgwa/sgwa.routes');
const authRoutes = require('./app/auth/auth.routes');
const dbConfig = require('./app/config/db.config');

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/officer/sgwa', sgwaRoutes);

// Error Handler
app.use((err, req, res, next) => {
    console.error(`[Server Error]: ${err.message}`);
    res.status(err.statusCode || 500).json({
        success: false,
        error: { code: err.code || 'SERVER_ERROR', message: err.message }
    });
});

const server = http.createServer(app);

async function runDiagnostic() {
    try {
        await mongoose.connect(dbConfig.url);
        console.log("✓ MongoDB connected");

        server.listen(PORT, async () => {
            console.log(`🚀 Diagnostic Server running on port ${PORT}`);
            try {
                const API_URL = `http://localhost:${PORT}/api`;

                // 1. Login
                console.log("1. Logging in as SGWA Officer...");
                const loginRes = await axios.post(`${API_URL}/auth/login`, {
                    username: 'sgwa.officer@rajasthan.gov.in',
                    password: 'password123',
                    userType: 'RSGWA'
                });
                const token = loginRes.data.data.token;
                console.log("   Login Success!");

                const headers = { Authorization: `Bearer ${token}` };

                // 2. Dashboard
                console.log("\n2. Fetching Dashboard Stats...");
                const dashRes = await axios.get(`${API_URL}/officer/sgwa/dashboard`, { headers });
                console.log("   Dashboard Stats obtained.");

                // 3. App List
                console.log("\n3. Fetching Application List...");
                const appsRes = await axios.get(`${API_URL}/officer/sgwa/applications`, { headers });
                const apps = appsRes.data.data.applications || [];
                console.log(`   Found ${apps.length} applications.`);

                if (apps.length > 0) {
                    // 4. Detail
                    const appId = apps[0].id;
                    console.log(`\n4. Fetching Details for ${appId}...`);
                    await axios.get(`${API_URL}/officer/sgwa/applications/${appId}`, { headers });
                    console.log("   Details obtained.");
                }

                // 5. Metrics Stub
                console.log("\n5. Fetching Metrics...");
                await axios.get(`${API_URL}/officer/sgwa/metrics`, { headers });
                console.log("   Metrics obtained.");

                console.log("\n✅ DIAGNOSTIC PASSED!");
            } catch (error) {
                console.error("\n❌ DIAGNOSTIC FAILED:", error.response ? JSON.stringify(error.response.data) : error.message);
            } finally {
                server.close();
                mongoose.disconnect();
                process.exit(0);
            }
        });
    } catch (err) {
        console.error("Startup Failed:", err);
        process.exit(1);
    }
}

runDiagnostic();
