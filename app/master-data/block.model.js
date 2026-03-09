const mongoose = require("mongoose");

const BlockSchema = new mongoose.Schema(
    {
        blockId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        blockName: {
            type: String,
            required: true,
            trim: true,
        },
        blockCode: {
            type: String,
            uppercase: true,
            trim: true,
        },
        districtId: {
            type: String,
            required: true,
            ref: "District",
        },
        // Block Category based on groundwater extraction
        category: {
            type: String,
            enum: ["SAFE", "SEMI_CRITICAL", "CRITICAL", "OVER_EXPLOITED"],
            required: true,
        },
        // Category determination criteria
        categoryCriteria: {
            dynamicGroundWaterResource: {
                type: Number, // in Ham (Hectare Meter)
                required: true,
            },
            annualGroundWaterExtraction: {
                type: Number, // in Ham
                required: true,
            },
            stageOfExtraction: {
                type: Number, // percentage
                required: true,
            },
        },
        // Additional metadata
        description: String,
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
BlockSchema.index({ districtId: 1 });
BlockSchema.index({ category: 1 });
BlockSchema.index({ isActive: 1 });

// Virtual to check if NOC is required based on category
BlockSchema.virtual("requiresNOC").get(function () {
    return ["SEMI_CRITICAL", "CRITICAL", "OVER_EXPLOITED"].includes(this.category);
});

// Ensure virtuals are included
BlockSchema.set("toJSON", { virtuals: true });
BlockSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Block", BlockSchema);
