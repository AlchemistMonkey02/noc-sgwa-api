// MongoDB Configuration
// Supports both Atlas (cloud) and local MongoDB

const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || "27017";
const DB_NAME = process.env.DB_NAME || "sgwa_db";

// Build MongoDB URI
let mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  if (DB_USERNAME && DB_PASSWORD) {
    // Check if it's an Atlas host (usually doesn't imply port if it is srv)
    // But better to expect full MONGODB_URI for Atlas.
    // We will support a generic construction:
    mongoUri = `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;
  } else {
    mongoUri = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  }
}

module.exports = {
  url: mongoUri
};
