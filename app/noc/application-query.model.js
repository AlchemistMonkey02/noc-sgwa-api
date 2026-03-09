const mongoose = require("mongoose");

const ApplicationQuerySchema = new mongoose.Schema(
    {
        queryId: {
            type: String,
            required: true,
            unique: true,
        },
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "NOCApplication",
        },

        // Query
        query: {
            type: String,
            required: true,
        },
        raisedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        raisedAt: {
            type: Date,
            default: Date.now,
        },

        // Subject/Title of the query
        subject: {
            type: String,
            required: true,
        },

        // New fields for classification
        category: {
            type: String,
            enum: ["Technical", "Documentation", "Legal", "Environmental", "Compliance", "Other", "TECHNICAL", "DOCUMENT_CLARIFICATION", "LEGAL", "ENVIRONMENTAL", "COMPLIANCE", "OTHER"],
            default: "Other",
        },
        priority: {
            type: String,
            enum: ["Critical", "High", "Medium", "Low", "CRITICAL", "HIGH", "MEDIUM", "LOW"],
            default: "Medium",
        },

        // Response
        response: String,
        responseDocument: {
            fileName: String,
            filePath: String,
            uploadedAt: Date,
        },
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        respondedAt: Date,

        // Status
        status: {
            type: String,
            enum: ["OPEN", "RESPONDED", "CLOSED"],
            default: "OPEN",
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ApplicationQuerySchema.index({ applicationId: 1, status: 1 });
ApplicationQuerySchema.index({ raisedAt: -1 });

module.exports = mongoose.model("ApplicationQuery", ApplicationQuerySchema);
