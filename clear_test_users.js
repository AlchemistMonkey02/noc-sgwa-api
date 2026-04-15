const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./app/auth/user.model');

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await User.deleteMany({ email: /test_.*@example.com/ });
    console.log(`Deleted ${result.deletedCount} test users`);

    await mongoose.disconnect();
}

run();
