const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./app/auth/user.model");

async function diagnose() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected successfully.");

        console.log("\n--- USER COUNTS BY TYPE ---");
        const counts = await User.aggregate([
            { $group: { _id: "$userType", count: { $sum: 1 } } }
        ]);
        console.log(JSON.stringify(counts, null, 2));

        console.log("\n--- ACTIVE OFFICERS ---");
        const roles = ["INSPECTION", "ENFORCEMENT", "SGWA", "RSGWA", "DGO"];
        const activeOfficers = await User.find({
            accountStatus: "ACTIVE",
            userType: { $in: roles }
        }).select("firstName lastName email phone userType accountStatus verificationStatus");

        console.log(`Found ${activeOfficers.length} active officers with relevant roles.`);
        if (activeOfficers.length > 0) {
            activeOfficers.forEach(u => {
                console.log(`- ${u.firstName} ${u.lastName} (${u.userType}) [${u.accountStatus}] - ${u.email}`);
            });
        }

        console.log("\n--- ALL USERS WITH OFFICER ROLES ---");
        const allOfficers = await User.find({
            userType: { $in: roles }
        }).select("firstName lastName email phone userType accountStatus verificationStatus");
        
        console.log(`Found ${allOfficers.length} users with officer roles (regardless of status).`);
        allOfficers.forEach(u => {
            console.log(`- ${u.firstName} ${u.lastName} (${u.userType}) [${u.accountStatus}]`);
        });

    } catch (err) {
        console.error("Diagnosis failed:", err);
    } finally {
        await mongoose.connection.close();
    }
}

diagnose();
