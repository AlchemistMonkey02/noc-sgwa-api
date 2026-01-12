module.exports = {
    secret: process.env.JWT_SECRET || "your_jwt_secret_change_this",
    jwtExpiration: 86400, // 24 hours in seconds
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "your_refresh_secret",
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "7d", // 7 days
};
