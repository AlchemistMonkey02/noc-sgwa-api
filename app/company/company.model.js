const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
    // Link to User
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    // Company Basic Information
    companyName: {
        type: String,
        trim: true,
    },
    companyType: {
        type: String,
    },
    industryType: {
        type: String,
    },

    // Registration Details
    incorporationId: {
        type: String,
        trim: true,
        sparse: true,
    },
    companyRegistrationNumber: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true,
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
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
    },
    landline: {
        type: String,
        trim: true,
    },
    alternatePhone: {
        type: String,
    },
    website: {
        type: String,
        trim: true,
    },

    // Registered Address
    registeredAddress: {
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
        city: String,
        pincode: {
            type: String,
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
        },
        designation: {
            type: String,
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
    },
    annualTurnover: {
        type: Number,
    },
    dateOfIncorporation: Date,

    // Documents
    documents: [{
        documentType: {
            type: String,
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
