require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dbConfig = require('../app/config/db.config');
const User = require('../app/auth/user.model');

async function resetPassword() {
    try {
        await mongoose.connect(dbConfig.url);

        const email = "applicant@test.com"; // The user we found earlier
        const newPassword = "password123";

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const user = await User.findOneAndUpdate(
            { email: email },
            { password: hashedPassword },
            { new: true }
        );

        if (user) {
            console.log(`SUCCESS: Password for ${email} reset to '${newPassword}'`);
        } else {
            console.log(`User ${email} not found.`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

resetPassword();
