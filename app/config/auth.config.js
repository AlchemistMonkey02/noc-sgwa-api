module.exports = {
  secret: process.env.JWT_SECRET || "your_jwt_secret_change_this",
  jwtExpiration: process.env.JWT_EXPIRATION || 86400 // 24 hours
};
