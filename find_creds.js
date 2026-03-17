const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./app/auth/user.model");

async function findCredentials() {
    await mongoose.connect(process.env.MONGODB_URI);
    const officers = await User.find({ userType: { $in: ["DGO","INSPECTION","ENFORCEMENT","RSGWA"] } })
        .select("firstName lastName email username userType accountStatus password")
        .lean();
    officers.forEach(u => {
        console.log(`${u.userType}: ${u.firstName} ${u.lastName} | email: ${u.email} | username: ${u.username} | hasPassword: ${!!u.password}`);
    });
    await mongoose.connection.close();
}
findCredentials().catch(console.error);
