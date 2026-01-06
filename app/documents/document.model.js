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
                "AADHAR",
                "PAN",
                "LAND_OWNERSHIP",
                "KHASRA_KHATAUNI",
                "SITE_PLAN",
                "BUILDING_PLAN",
                "POLLUTION_NOC",
                "FACTORY_LICENSE",
                "TRADE_LICENSE",
                "GST_CERTIFICATE",
                "UNDERTAKING",
                "WATER_ANALYSIS",
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
