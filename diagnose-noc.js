const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const axios = require('axios');
require('dotenv').config();

const nocRoutes = require('./app/noc/noc.routes');
const dbConfig = require('./app/config/db.config');

const app = express();
const PORT = 3006;

app.use(express.json());
// Mount NOC routes
app.use('/api/applications/noc', nocRoutes);

// Error Handler
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: false,
        error: { code: err.code || 'SERVER_ERROR', message: err.message }
    });
});

const server = http.createServer(app);

async function runDiagnostic() {
    try {
        await mongoose.connect(dbConfig.url);
        server.listen(PORT, async () => {
            console.log(`Diagnostic Server on ${PORT}`);
            try {
                // Test Public Route
                const url = `http://localhost:${PORT}/api/applications/noc/ref/TEST-TRACK-123/document`;
                console.log(`Testing Public Route: ${url}`);
                await axios.get(url);
                console.log("✅ Request Valid (Status 200/Download)");
            } catch (error) {
                if (error.response) {
                    console.log(`Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
                    if (error.response.data.error?.code === "APPLICATION_NOT_FOUND") {
                        console.log("✅ Route is PUBLIC (Auth bypassed, Hit Service Logic)");
                    } else if (error.response.data.error?.code === "AUTHENTICATION_REQUIRED") {
                        console.error("❌ Route is PROTECTED (Failed)");
                    } else {
                        console.log("⚠️ Route hit but other error (Expected for invalid ID)");
                    }
                } else {
                    console.error("❌ Request Failed:", error.message);
                }
            } finally {
                server.close();
                mongoose.disconnect();
                process.exit(0);
            }
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runDiagnostic();
