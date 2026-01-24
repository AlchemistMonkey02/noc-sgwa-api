// Load environment variables
// version 1.1.0
require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const mongoose = require("mongoose");
const dbConfig = require("./app/config/db.config");
const errorMiddleware = require("./app/middleware/error.middleware");
const logger = require("./app/utils/logger");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
  credentials: true
}));

// Compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  next();
});

// Connect to MongoDB
mongoose
  .connect(dbConfig.url)
  .then(() => {
    logger.info("Successfully connected to MongoDB");
    console.log("✓ MongoDB connected");
  })
  .catch((err) => {
    logger.error("MongoDB connection error", err);
    console.error("✗ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SGWA API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});


app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

// Public routes (no authentication)
app.use("/api/public", require("./app/public/public.routes"));
app.use("/api/tools", require("./app/calculators/calculator.routes"));
app.use("/api/tools", require("./app/eligibility/eligibility.routes"));

// API Routes
app.use("/api/auth", require("./app/auth/auth.routes"));
app.use("/api/users", require("./app/auth/user.routes")); // New: User listing
app.use("/api/master", require("./app/master-data/master.routes"));
app.use("/api/master-data", require("./app/master-data/master-data.routes"));
app.use("/api/documents", require("./app/documents/document.routes"));
app.use("/api/applications/noc", require("./app/noc/noc.routes"));
app.use("/api/noc", require("./app/noc/compliance.routes")); // Compliance routes
app.use("/api/self-compliance", require("./app/noc/self-compliance.routes")); // AI Auto-Compliance
app.use("/api/queries", require("./app/noc/query.routes")); // Query Management
app.use("/api/officer/common", require("./app/officers/common/common.routes"));
app.use("/api/officer/sgwa", require("./app/officers/sgwa/sgwa.routes"));
app.use("/api/officer/dgo", require("./app/officers/dgo/dgo.routes"));
app.use("/api/officer/enforcement", require("./app/officers/enforcement/enforcement.routes"));
app.use("/api/officer/inspection", require("./app/officers/inspection/inspection.routes"));
// app.use("/api/officer", require("./app/noc/officer.routes")); // Deprecated generic route
app.use("/api/companies", require("./app/company/company.routes"));
app.use("/api/notifications", require("./app/notifications/notification.routes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler (must be last)
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
  console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📧 Email configured: ${process.env.SMTP_USER ? "Yes" : "No"}`);
  console.log(`\n✅ API Ready!\n`);
  console.log(`🔄 Server reloaded at ${new Date().toISOString()}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection", err);
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});