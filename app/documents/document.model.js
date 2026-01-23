const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
    {
        documentId: {
            type: String,
            unique: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        // Company reference (documents linked to company)
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            index: true,
        },
        applicationId: {
            type: String,
            // ref: "NOCApplication", // Relationship is based on UUID string, not ObjectId
            index: true,
        },

        // Document details
        documentType: {
            type: String,
        },
        documentName: {
            type: String,
        },
        originalFilename: {
            type: String,
        },
        storedFilename: {
            type: String,
        },
        filePath: {
            type: String,
        },
        fileSize: {
            type: Number, // in bytes
        },
        mimeType: {
            type: String,
        },

        // Three-Way Verification (DGO → SGWA → Enforcement)
        verification: {
            ai: {
                verified: { type: Boolean, default: false },
                confidence: Number,
                verifiedAt: Date,
                remarks: String,
                status: { type: String, default: "PENDING" }
            },
            dgo: {
                verified: { type: Boolean, default: false },
                verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                verifiedAt: Date,
                remarks: String,
                status: { type: String, default: "PENDING" }
            },
            sgwa: {
                verified: { type: Boolean, default: false },
                verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                verifiedAt: Date,
                remarks: String,
                status: { type: String, default: "PENDING" }
            },
            enforcement: {
                verified: { type: Boolean, default: false },
                verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                verifiedAt: Date,
                remarks: String,
                status: { type: String, default: "PENDING" }
            }
        },

        // Legacy Verification (kept for backward compatibility)
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
