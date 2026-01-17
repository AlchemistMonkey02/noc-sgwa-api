require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./app/auth/user.model');
const dbConfig = require('./app/config/db.config');

async function checkUser() {
    try {
        await mongoose.connect(dbConfig.url);
        const email = 'sgwa.officer@rajasthan.gov.in';
        const user = await User.findOne({ email });
        console.log("User:", user ? { email: user.email, userType: user.userType, role: user.role } : "NOT FOUND");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkUser();
