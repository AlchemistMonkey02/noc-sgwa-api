require("dotenv").config();
const mongoose = require("mongoose");
const dbConfig = require("../app/config/db.config");

console.log("--- Debugging MongoDB Connection ---");
if (process.env.MONGODB_URI) {
    console.log("MONGODB_URI is set.");
    // Mask password in URI for safe logging
    const maskedUri = process.env.MONGODB_URI.replace(/:([^:@]+)@/, ":****@");
    console.log("Connection String:", maskedUri);
    if (process.env.MONGODB_URI.trim() !== process.env.MONGODB_URI) {
        console.warn("WARNING: MONGODB_URI has leading/trailing whitespace!");
    }
} else {
    console.log("MONGODB_URI is NOT set. Using fallback components.");
    // Check individual components for whitespace
    ["DB_USERNAME", "DB_PASSWORD", "DB_HOST", "DB_NAME"].forEach(key => {
        const val = process.env[key];
        if (val && val.trim() !== val) {
            console.warn(`WARNING: ${key} has leading/trailing whitespace!`);
        }
    });

    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_PORT:", process.env.DB_PORT);
    console.log("DB_NAME:", process.env.DB_NAME);
    console.log("DB_USERNAME:", process.env.DB_USERNAME);
    console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "****" : "(not set)");
}


console.log("Computed dbConfig.url:", dbConfig.url.replace(/:([^:@]+)@/, ":****@"));

console.log("Attempting connection...");

mongoose.connect(dbConfig.url)
    .then(() => {
        console.log("✓ Successfully connected to MongoDB!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("✗ Connection failed:", err.message);
        console.error("Full Error:", JSON.stringify(err, null, 2));
        process.exit(1);
    });
