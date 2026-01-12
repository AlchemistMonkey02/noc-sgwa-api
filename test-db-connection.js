
const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

console.log("🔍 Diagnosis starting...");
console.log("Checking MongoDB URI presence...");

if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env file");
    process.exit(1);
} else {
    console.log("✅ MONGODB_URI is found (hidden for security)");
}

// Extract hostname from URI
const match = uri.match(/@([^/]+)/);
const hostname = match ? match[1] : null;

if (hostname) {
    console.log(`\nTesting DNS resolution for: ${hostname}`);
    // Handle comma-separated lists (cluster method)
    const hosts = hostname.split(',');

    hosts.forEach(host => {
        // Remove port if present
        const domain = host.split(':')[0];
        console.log(`Looking up: ${domain}`);
        dns.lookup(domain, (err, address, family) => {
            if (err) {
                console.error(`❌ DNS Lookup failed for ${domain}:`, err.message);
            } else {
                console.log(`✅ DNS resolved ${domain} -> ${address}`);
            }
        });
    });
} else {
    console.log("⚠️ Could not parse hostname from URI");
}

console.log("\nAttempting Mongoose Connection...");
mongoose.connect(uri)
    .then(() => {
        console.log("✅ Mongoose Connected Successfully!");
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ Mongoose Connection Failed:");
        console.error(err);
        process.exit(1);
    });
