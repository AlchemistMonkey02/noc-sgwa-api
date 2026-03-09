const mongoose = require("mongoose");
const sgwaService = require("./app/officers/sgwa/sgwa.service");
require("dotenv").config();

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Using any officer ID, SGWA stats are mostly status based
    const officerId = "699fd74ca9fb6cc3ccf1b18e"; // Reuse the DGO ID as a placeholder if needed, or get an SGWA one

    console.log("Testing sgwaService.getDashboardStats...");
    try {
        const stats = await sgwaService.getDashboardStats(officerId);
        console.log("Result:", JSON.stringify(stats, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }

    process.exit(0);
}

test();
