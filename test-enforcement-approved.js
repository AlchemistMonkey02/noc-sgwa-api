const mongoose = require("mongoose");
require("dotenv").config();

// Load models properly
require("./app/auth/user.model");
require("./app/company/company.model");
require("./app/noc/noc-application.model");
const enforcementService = require("./app/officers/enforcement/enforcement.service");

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const officerId = "699fd74ca9fb6cc3ccf1b18e";

        console.log("\nTesting enforcementService.getApprovalQueue with status NOC_ISSUED...");
        const queue = await enforcementService.getApprovalQueue(officerId, { status: 'NOC_ISSUED' });

        console.log("Queue Result Count:", queue.total);
        if (queue.queue && queue.queue.length > 0) {
            console.log("First item in queue:", JSON.stringify(queue.queue[0], null, 2));
        } else {
            console.log("No issued NOCs found in database.");
        }
    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

test();
