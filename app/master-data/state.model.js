const mongoose = require("mongoose");

const StateSchema = new mongoose.Schema(
    {
        stateId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        stateName: {
            type: String,
            required: true,
            trim: true,
        },
        stateCode: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
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
StateSchema.index({ stateId: 1 });
StateSchema.index({ isActive: 1 });

module.exports = mongoose.model("State", StateSchema);
