const mongoose = require('mongoose');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

async function testCustomIDs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✓ Connected to MongoDB");

        const User = require('./app/auth/user.model');
        const NOCApplication = require('./app/noc/noc-application.model');

        // 1. Verify UserID generation
        console.log("\n--- Testing User ID Generation ---");
        const uniqueEmail = `testuser_${Date.now()}@example.com`;
        const testUser = new User({
            email: uniqueEmail,
            phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
            password: "password123",
            firstName: "Test",
            lastName: "User"
        });

        await testUser.save();
        console.log(`✓ User Created with Username: ${testUser.username}`);

        if (/^usernoc\d{3}$/.test(testUser.username)) {
            console.log("✅ User ID format matches 'usernocXXX'");
        } else {
            console.log("❌ User ID format mismatch!");
        }

        // 2. Verify NOC ID generation
        console.log("\n--- Testing NOC ID Generation ---");
        const appPayload = {
            applicationId: uuidv4(),
            userId: testUser._id,
            status: "SUBMITTED",
            projectDetails: { projectName: "Test Project ID Gen" },
            location: { districtId: "JAIPUR", blockId: "SANG" }
        };

        const application = new NOCApplication(appPayload);
        await application.save();
        console.log(`✓ NOC Created with Application Number: ${application.applicationNumber}`);

        // Format: Noc/YYYY/DDMM/NocXXXX
        const now = new Date();
        const year = now.getFullYear();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const datePart = `${day}${month}`;
        const regex = new RegExp(`^Noc/${year}/${datePart}/Noc\\d{4}$`);

        if (regex.test(application.applicationNumber)) {
            console.log(`✅ NOC ID format matches 'Noc/${year}/${datePart}/NocXXXX'`);
        } else {
            console.log("❌ NOC ID format mismatch!");
        }

        console.log("\n🎯 ID FORMAT VERIFICATION COMPLETED 🎯");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Verification Failed!", err);
        process.exit(1);
    }
}

testCustomIDs();
