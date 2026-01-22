require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dbConfig = require('../app/config/db.config');
const User = require('../app/auth/user.model');

async function resetEnforcementPassword() {
    try {
        await mongoose.connect(dbConfig.url);

        const username = "enforcement_admin";
        const newPassword = "password123";

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const user = await User.findOneAndUpdate(
            { username: username },
            { password: hashedPassword },
            { new: true }
        );

        if (user) {
            console.log(`SUCCESS: Password for ${username} reset to '${newPassword}'`);
            console.log(`User ID: ${user._id}`);
            console.log(`Email: ${user.email}`);
        } else {
            console.log(`User ${username} not found. Searching by role...`);

            // Fallback: Find by role if username doesn't match
            const enforcementUser = await User.findOne({ userType: 'ENFORCEMENT' });
            if (enforcementUser) {
                console.log(`Found enforcement user: ${enforcementUser.username} (${enforcementUser.email})`);
                // Update this one
                enforcementUser.password = hashedPassword;
                await enforcementUser.save();
                console.log(`SUCCESS: Password for ${enforcementUser.username} reset to '${newPassword}'`);
            } else {
                console.log("No ENFORCEMENT user found in DB.");
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

resetEnforcementPassword();
