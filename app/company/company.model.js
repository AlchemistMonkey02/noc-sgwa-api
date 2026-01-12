const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
    {
        // Link to User
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
            index: true,
        },

        // Company Basic Information
        companyName: {
            type: String,
            required: [true, "Company name is required"],
            trim: true,
            index: true,
        },
        companyType: {
            type: String,
            enum: ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "PARTNERSHIP", "PROPRIETORSHIP", "LLP", "GOVERNMENT", "NGO", "TRUST", "SOCIETY", "COOPERATIVE"],
            required: [true, "Company type is required"],
        },
        industryType: {
            type: String,
            required: [true, "Industry type is required"],
        },

        // Registration Details
        companyRegistrationNumber: {
            type: String,
            trim: true,
            uppercase: true,
            sparse: true, // Unique but allows null
        },
        cinNumber: {
            type: String,
            trim: true,
            uppercase: true,
            sparse: true,
        },
        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
            unique: true,
            sparse: true
        },
        panNumber: {
            type: String,
            trim: true,
            uppercase: true,
            sparse: true
        },
        tanNumber: {
            type: String,
            trim: true,
            uppercase: true,
        },

        // Contact Information
        email: {
            type: String,
            required: [true, "Company email is required"],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
        },
        phone: {
            type: String,
            required: [true, "Company phone is required"],
            match: [/^[6-9]\d{9}$/, "Please provide a valid 10-digit Indian phone number"],
        },
        landline: {
            type: String,
            trim: true,
        },
        alternatePhone: {
            type: String,
            match: [/^[6-9]\d{9}$/, "Please provide a valid 10-digit Indian phone number"],
        },
        website: {
            type: String,
            trim: true,
        },

        // Registered Address
        registeredAddress: {
            addressLine1: {
                type: String,
                required: [true, "Address Line 1 is required"],
            },
            addressLine2: String,
            addressLine3: String,
            state: {
                type: String,
                required: [true, "State is required"],
            },
            district: {
                type: String,
                required: [true, "District is required"],
            },
            city: String,
            pincode: {
                type: String,
                required: [true, "Pincode is required"],
                match: [/^[1-9][0-9]{5}$/, "Invalid pincode"],
            },
        },

        // Communication Address
        communicationAddress: {
            addressLine1: String,
            addressLine2: String,
            addressLine3: String,
            state: String,
            district: String,
            city: String,
            pincode: {
                type: String,
                match: [/^[1-9][0-9]{5}$/, "Invalid pincode"],
            },
        },
        sameAsRegistered: {
            type: Boolean,
            default: false,
        },

        // Authorized Person Details
        authorizedPerson: {
            name: {
                type: String,
                required: [true, "Authorized person name is required"],
            },
            designation: {
                type: String,
                required: [true, "Designation is required"],
            },
            email: String,
            phone: String,
            aadhaarNumber: String,
            authorizationLetter: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Document",
            }
        },

        // Employment & Financial
        numberOfEmployees: {
            type: Number,
            min: 0,
        },
        annualTurnover: {
            type: Number,
            min: 0,
        },
        dateOfIncorporation: Date,

        // Documents
        documents: [{
            documentType: {
                type: String,
                enum: ["INCORPORATION_CERTIFICATE", "GST_CERTIFICATE", "PAN_CARD", "MOA", "AOA", "PARTNERSHIP_DEED", "OWNERSHIP_PROOF", "OTHER"],
            },
            documentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Document",
            },
            uploadedAt: Date,
        }],

        // Status & Verification
        verificationStatus: {
            type: String,
            enum: ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"],
            default: "PENDING",
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        verifiedAt: Date,
        verificationRemarks: String,

        // Document Verification Tracking
        documentVerifications: [{
            documentType: String,
            documentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Document"
            },
            status: {
                type: String,
                enum: ["PENDING", "APPROVED", "REJECTED"],
                default: "PENDING"
            },
            remarks: String,
            verifiedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            verifiedAt: Date
        }],

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
            default: "ACTIVE",
        },
        isApproved: {
            type: Boolean,
            default: false,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        approvedAt: Date,
        rejectionReason: String,

        // Additional Information
        remarks: String,

    },
    {
        timestamps: true,
    }
);

// Indexes
CompanySchema.index({ userId: 1, status: 1 });
CompanySchema.index({ gstNumber: 1 });
CompanySchema.index({ companyName: 1 });
CompanySchema.index({ verificationStatus: 1 });

// Virtual for full address
CompanySchema.virtual("fullRegisteredAddress").get(function () {
    const addr = this.registeredAddress;
    return `${addr.addressLine1}, ${addr.addressLine2 || ""}, ${addr.city || addr.district}, ${addr.state} - ${addr.pincode}`.replace(/,\s*,/g, ",");
});

// Ensure virtuals are included in JSON
CompanySchema.set("toJSON", { virtuals: true });
CompanySchema.set("toObject", { virtuals: true });

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;
