const mongoose = require("mongoose");
const dgoService = require("./app/officers/dgo/dgo.service");
require("dotenv").config();

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Using the ID from my previous check: 699fd74ca9fb6cc3ccf1b18e
    const officerId = "699fd74ca9fb6cc3ccf1b18e";

    console.log("Testing dgoService.getDashboardStats for officerId:", officerId);
    try {
        const stats = await dgoService.getDashboardStats(officerId);
        console.log("Result:", JSON.stringify(stats, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }

    process.exit(0);
}

test();
