const mongoose = require("mongoose");

const TehsilSchema = new mongoose.Schema(
    {
        tehsilId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        tehsilName: {
            type: String,
            required: true,
            trim: true,
        },
        districtId: {
            type: String,
            required: true,
            ref: "District",
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
TehsilSchema.index({ tehsilId: 1 });
TehsilSchema.index({ districtId: 1 });
TehsilSchema.index({ isActive: 1 });

module.exports = mongoose.model("Tehsil", TehsilSchema);
