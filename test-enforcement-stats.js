const mongoose = require("mongoose");
const enforcementService = require("./app/officers/enforcement/enforcement.service");
require("dotenv").config();

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Enforcement stats are pool-based now
    const officerId = "699fd74ca9fb6cc3ccf1b18e";

    console.log("Testing enforcementService.getDashboardStats...");
    try {
        const stats = await enforcementService.getDashboardStats(officerId);
        console.log("Stats Result:", JSON.stringify(stats, null, 2));

        console.log("\nTesting enforcementService.getApprovalQueue with status NOC_ISSUED...");
        const queue = await enforcementService.getApprovalQueue(officerId, { status: 'NOC_ISSUED' });
        console.log("Queue Result Count:", queue.total);
        if (queue.queue && queue.queue.length > 0) {
            console.log("First item in queue:", JSON.stringify(queue.queue[0], null, 2));
        }
    } catch (err) {
        console.error("Error:", err);
    }

    process.exit(0);
}

test();
