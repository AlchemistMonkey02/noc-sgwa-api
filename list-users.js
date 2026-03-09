require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./app/auth/user.model');

async function fixSGWAUser() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected\n');

    // List all users and their types
    console.log('=== All Users ===');
    const allUsers = await User.find({}).select('firstName lastName email userType role');
    allUsers.forEach(u => console.log(`  ${u.email} | userType: ${u.userType} | role: ${u.role}`));

    await mongoose.disconnect();
}

fixSGWAUser().catch(console.error);
