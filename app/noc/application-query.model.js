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
            index: true,
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

        // Response
        response: String,
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
            index: true,
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
