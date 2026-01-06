// MongoDB Configuration
// Supports both Atlas (cloud) and local MongoDB

const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;

// Build MongoDB Atlas URI if credentials are provided
let mongoUri;

if (DB_USERNAME && DB_PASSWORD) {
  // MongoDB Atlas connection
  mongoUri = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.vonp3t0.mongodb.net/noc?appName=Cluster0`;
} else {
  // Fallback to local MongoDB or custom URI
  mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/sgwa_db";
}

module.exports = {
  url: mongoUri
};
