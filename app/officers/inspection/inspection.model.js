const mongoose = require("mongoose");

const InspectionSchema = new mongoose.Schema(
    {
        inspectionId: {
            type: String,
            required: true,
            unique: true
        },
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NOCApplication",
            required: true
        },
        officerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            default: "SCHEDULED"
        },
        scheduledDate: {
            type: Date,
            required: true
        },
        startedAt: Date,
        completedAt: Date,
        instructions: String,
        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH"],
            default: "MEDIUM"
        },

        // Location Data from Check-In
        checkInLocation: {
            latitude: Number,
            longitude: Number,
            timestamp: Date
        },

        // Final Report Data
        report: {
            locationMatch: Boolean,
            landUseMatch: Boolean,
            existingSources: { type: Number, default: 0 },
            meterInstalled: {
                type: String,
                enum: ["YES", "NO", "NA"], // YES, NO, Not Applicable (New Project)
                default: "NO"
            },
            rainwaterHarvesting: {
                type: String,
                enum: ["IMPLEMENTED", "UNDER_CONSTRUCTION", "NOT_STARTED"],
                default: "NOT_STARTED"
            },
            // Keeping plantationStatus as it's often required even if not in snippet
            plantationStatus: {
                type: String,
                enum: ["STARTED", "NOT_STARTED", "COMPLETED"],
                default: "NOT_STARTED"
            },
            remarks: String,
            recommendation: {
                type: String,
                enum: ["RECOMMENDED", "CONDITIONAL", "NOT_RECOMMENDED"]
            },
            geoLocation: {
                lat: Number,
                lng: Number,
                accuracy: Number
            },
            photos: [String] // Array of photo URLs or IDs
        },

        isDraft: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Inspection", InspectionSchema);
