const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        // Authentication
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
        },

        // Personal Information
        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
        },

        // User Type & Role
        userType: {
            type: String,
            enum: ["APPLICANT", "DGO", "RSGWA", "ENFORCEMENT"],
            default: "APPLICANT",
            required: true,
        },

        // Organization Details
        organizationName: {
            type: String,
            trim: true,
        },
        organizationType: {
            type: String,
            enum: ["INDIVIDUAL", "COMPANY", "GOVERNMENT", "NGO"],
        },

        // Tax & Registration
        panNumber: {
            type: String,
            trim: true,
            uppercase: true,
        },
        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
        },

        // Address
        address: {
            line1: String,
            line2: String,
            city: String,
            state: String,
            pincode: String,
        },

        // Verification Status
        verificationStatus: {
            type: String,
            enum: ["PENDING", "VERIFIED", "REJECTED"],
            default: "PENDING",
        },
        accountStatus: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
            default: "ACTIVE",
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        phoneVerified: {
            type: Boolean,
            default: false,
        },

        // Password Reset
        resetPasswordToken: String,
        resetPasswordExpire: Date,

        // Activity Tracking
        lastLogin: Date,
        loginCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Create indexes for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ userType: 1 });
UserSchema.index({ verificationStatus: 1 });

// Virtual for full name
UserSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", UserSchema);

module.exports = User;
