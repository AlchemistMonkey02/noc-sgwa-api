const mongoose = require("mongoose");

// OTP Model for verification
const OTPSchema = new mongoose.Schema(
    {
        identifier: {
            type: String, // email or phone
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["EMAIL", "MOBILE"],
            required: true,
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // Auto-delete after expiry
        },
        verified: {
            type: Boolean,
            default: false,
        },
        attempts: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for cleanup
OTPSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 }); // Delete after 10 minutes

module.exports = mongoose.model("OTP", OTPSchema);
