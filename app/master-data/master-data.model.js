const mongoose = require("mongoose");

const MasterDataSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: [
                "APPLICATION_SUB_TYPE",
                "PROJECT_TYPE",
                "WATER_QUALITY_TYPE",
                "UTILIZATION_PURPOSE",
                "MSME_TYPE",
                "APPLICATION_TYPE",
                "ORGANIZATION_TYPE",
                "PROJECT_CATEGORY",
                "GEOLOGY_TYPE",
                "GEOLOGY_TYPE",
                "METER_TYPE",
                "AREA_CATEGORY",
                // New Types for Digital Flow Meter
                "METER_MANUFACTURER",
                "METER_MODEL",
                "METER_SERIAL_NUMBER",
                "TELEMETRY_PROVIDER",
                "BIS_STANDARD",
                "NABL_LAB"
            ],
            index: true,
        },
        code: {
            type: String,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
        // Metadata for linking (e.g., Model -> Manufacturer)
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        displayOrder: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

// Compound index for uniqueness
MasterDataSchema.index({ type: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("MasterData", MasterDataSchema);
