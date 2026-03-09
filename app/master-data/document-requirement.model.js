const mongoose = require("mongoose");

const DocumentRequirementSchema = new mongoose.Schema(
    {
        documentId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        documentName: {
            type: String,
            required: true,
            trim: true,
        },
        documentType: {
            type: String,
            required: true,
            enum: [
                "IDENTITY_PROOF",
                "ADDRESS_PROOF",
                "OWNERSHIP_PROOF",
                "NOC",
                "LICENSE",
                "CERTIFICATE",
                "PLAN",
                "REPORT",
                "FINANCIAL",
                "OTHER",
            ],
        },
        applicationType: {
            type: String,
            required: true,
            enum: [
                "NEW_NOC",
                "RENEWAL",
                "AMENDMENT",
                "RIG_REGISTRATION",
                "RIG_OPERATION",
                "ALL",
            ],
        },
        isMandatory: {
            type: Boolean,
            default: true,
        },
        description: String,
        maxFileSize: {
            type: Number, // in MB
            default: 5,
        },
        allowedFormats: [
            {
                type: String,
                lowercase: true,
            },
        ],
        sampleUrl: String,
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
DocumentRequirementSchema.index({ applicationType: 1 });
DocumentRequirementSchema.index({ isMandatory: 1 });
DocumentRequirementSchema.index({ isActive: 1 });

module.exports = mongoose.model("DocumentRequirement", DocumentRequirementSchema);
