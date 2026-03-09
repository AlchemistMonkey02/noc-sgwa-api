const mongoose = require('mongoose');
const uri = "mongodb+srv://nocadmin:admin@cluster0.vonp3t0.mongodb.net/?appName=Cluster0";

console.log("Attempting to connect to MongoDB...");
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log("Connected successfully!");
        process.exit(0);
    })
    .catch(err => {
        console.error("Connection error:", err.message);
        process.exit(1);
    });
