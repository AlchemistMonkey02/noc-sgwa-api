const mongoose = require("mongoose");

const DistrictSchema = new mongoose.Schema(
    {
        districtId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        districtName: {
            type: String,
            required: true,
            trim: true,
        },
        districtCode: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        stateId: {
            type: String,
            required: true,
            ref: "State",
        },
        latitude: {
            type: Number,
        },
        longitude: {
            type: Number,
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
DistrictSchema.index({ districtId: 1 });
DistrictSchema.index({ stateId: 1 });
DistrictSchema.index({ isActive: 1 });

module.exports = mongoose.model("District", DistrictSchema);
