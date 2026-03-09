const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        // Authentication
        email: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
        },

        // Personal Information
        title: {
            type: String,
        },
        profilePicture: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
        },
        signature: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
        },
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        dateOfBirth: {
            type: Date,
        },
        gender: {
            type: String,
        },

        // ID Proof Information
        uidNumber: {
            type: String,
            trim: true,
            sparse: true,
        },
        idProofType: {
            type: String,
        },
        idProofNumber: {
            type: String,
            trim: true,
        },
        idProofDocument: String,

        // Communication Address
        communicationAddress: {
            addressLine1: {
                type: String,
            },
            addressLine2: String,
            addressLine3: String,
            state: {
                type: String,
            },
            district: {
                type: String,
            },
            subDistrict: String,
            pincode: {
                type: String,
            },
        },

        // Login Credentials
        username: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true,
        },
        securityQuestion: String,
        securityAnswer: String,

        // User Type & Role
        userType: {
            type: String,
            default: "APPLICANT",
        },

        // Organization Details
        organizationName: {
            type: String,
            trim: true,
        },
        organizationType: {
            type: String,
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
            default: "PENDING",
        },
        accountStatus: {
            type: String,
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
UserSchema.index({ userType: 1 });
UserSchema.index({ verificationStatus: 1 });

// Virtual for full name
UserSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

// Auto-generate username on creation if not provided
UserSchema.pre("save", async function () {
    if (this.isNew && !this.username) {
        const rolePrefixMap = {
            'APPLICANT': 'usernoc',
            'DGO': 'dgonoc',
            'RSGWA': 'sgwanoc',
            'ENFORCEMENT': 'enfnoc',
            'INSPECTION': 'inspnoc'
        };

        const prefix = rolePrefixMap[this.userType] || 'usernoc';
        const count = await this.constructor.countDocuments({ userType: this.userType });
        this.username = `${prefix}${String(count + 1).padStart(3, "0")}`;
    }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
