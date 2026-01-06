const mongoose = require("mongoose");

const IndustryTypeSchema = new mongoose.Schema(
    {
        industryTypeId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        industryName: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            enum: [
                "AGRICULTURE",
                "MANUFACTURING",
                "MINING",
                "CONSTRUCTION",
                "HOSPITALITY",
                "HEALTHCARE",
                "EDUCATION",
                "COMMERCIAL",
                "DOMESTIC",
                "OTHER",
            ],
        },
        description: String,
        requiredDocuments: [
            {
                type: String,
            },
        ],
        waterRequirement: {
            min: Number, // MLD (Million Liters per Day)
            max: Number,
        },
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
IndustryTypeSchema.index({ industryTypeId: 1 });
IndustryTypeSchema.index({ category: 1 });
IndustryTypeSchema.index({ isActive: 1 });

module.exports = mongoose.model("IndustryType", IndustryTypeSchema);
