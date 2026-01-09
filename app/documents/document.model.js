const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
    {
        documentId: {
            type: String,
            required: true,
            unique: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
            index: true,
        },
        // Company reference (documents linked to company)
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: false,  // Optional - some docs may not be company-specific
            index: true,
        },
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NOCApplication",
            index: true,
        },

        // Document details
        documentType: {
            type: String,
            required: true,
            enum: [
                // Identity Documents
                "AADHAR",
                "PAN",

                // Land/Property Documents
                "LAND_OWNERSHIP",
                "KHASRA_KHATAUNI",
                "REVENUE_RECORDS",
                "LEASE_DEED",
                "SALE_DEED",

                // Site/Project Documents
                "SITE_PLAN",
                "BUILDING_PLAN",
                "LAYOUT_PLAN",

                // CGWA Specific Documents
                "PUMPING_TEST_REPORT",
                "HYDROGEOLOGICAL_REPORT",
                "WATER_QUALITY_REPORT",
                "WATER_ANALYSIS",
                "CONSERVATION_PLAN",
                "RAINWATER_HARVESTING_PLAN",
                "GREEN_BELT_PLAN",
                "WATER_AUDIT_REPORT",
                "RECYCLING_PLAN",

                // Clearances & Licenses
                "EXISTING_NOC",
                "EC_CERTIFICATE",
                "CTO_CTE",
                "POLLUTION_NOC",
                "FOREST_CLEARANCE",
                "FACTORY_LICENSE",
                "TRADE_LICENSE",

                // Company Documents
                "GST_CERTIFICATE",
                "MSME_CERTIFICATE",
                "INCORPORATION_CERTIFICATE",
                "PARTNERSHIP_DEED",

                // Legal Documents
                "UNDERTAKING",
                "AFFIDAVIT",
                "INDEMNITY_BOND",

                // Technical Documents
                "BOREWELL_COMPLETION_REPORT",
                "SOIL_INVESTIGATION_REPORT",
                "GEOPHYSICAL_SURVEY",

                // Others
                "OTHER",
            ],
        },
        documentName: {
            type: String,
            required: true,
        },
        originalFilename: {
            type: String,
            required: true,
        },
        storedFilename: {
            type: String,
            required: true,
        },
        filePath: {
            type: String,
            required: true,
        },
        fileSize: {
            type: Number, // in bytes
            required: true,
        },
        mimeType: {
            type: String,
            required: true,
        },

        // Verification
        isVerified: {
            type: Boolean,
            default: false,
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        verifiedAt: Date,

        // Status
        status: {
            type: String,
            enum: ["UPLOADED", "VERIFIED", "REJECTED"],
            default: "UPLOADED",
        },
        rejectionReason: String,

        // Metadata
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
DocumentSchema.index({ documentId: 1 });
DocumentSchema.index({ userId: 1, documentType: 1 });
DocumentSchema.index({ applicationId: 1 });
DocumentSchema.index({ status: 1 });

// Virtual for file size in MB
DocumentSchema.virtual("fileSizeMB").get(function () {
    return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Ensure virtuals are included
DocumentSchema.set("toJSON", { virtuals: true });
DocumentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Document", DocumentSchema);
