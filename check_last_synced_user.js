const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./app/auth/user.model');

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({ email: /test_.*@example.com/ }).sort({ createdAt: -1 }).limit(2);
    console.log('Latest 2 test users:');
    users.forEach(u => {
        const obj = u.toObject();
        console.log(`User: ${obj.email}`);
        console.log(`Username: ${obj.username}`);
        console.log(`Password Hash: ${obj.password}`);
        console.log(`Bcrypt format? ${obj.password?.startsWith('$2a$') || obj.password?.startsWith('$2b$')}`);
        console.log('---');
    });

    await mongoose.disconnect();
}

run();
