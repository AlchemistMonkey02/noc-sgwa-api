const mongoose = require("mongoose");

const FeeStructureSchema = new mongoose.Schema(
    {
        feeId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        applicationType: {
            type: String,
            required: true,
            enum: ["NEW", "NEW_NOC", "RENEWAL", "AMENDMENT", "RIG_REGISTRATION", "RIG_OPERATION"],
        },
        blockCategory: {
            type: String,
            required: true,
            enum: ["SAFE", "SEMI_CRITICAL", "CRITICAL", "OVER_EXPLOITED", "ALL"],
        },
        // Fee components
        baseAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        ecChargesPerMLD: {
            type: Number, // Environmental Compensation charges per MLD
            default: 0,
        },
        waterBudgetCharges: {
            type: Number,
            default: 0,
        },
        processingFee: {
            type: Number,
            default: 0,
        },
        inspectionFee: {
            type: Number,
            default: 0,
        },
        // Validity period
        validityPeriod: {
            years: {
                type: Number,
                default: 3,
            },
            description: String,
        },
        description: String,
        // Effective date range
        effectiveFrom: {
            type: Date,
            required: true,
        },
        effectiveTo: {
            type: Date,
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
FeeStructureSchema.index({ feeId: 1 });
FeeStructureSchema.index({ applicationType: 1, blockCategory: 1 });
FeeStructureSchema.index({ isActive: 1 });
FeeStructureSchema.index({ effectiveFrom: 1, effectiveTo: 1 });

// Virtual to calculate total base fee
FeeStructureSchema.virtual("totalBaseFee").get(function () {
    return (
        this.baseAmount +
        this.waterBudgetCharges +
        this.processingFee +
        this.inspectionFee
    );
});

// Method to calculate total fee including EC charges
FeeStructureSchema.methods.calculateTotalFee = function (waterRequirementMLD) {
    const ecCharges = this.ecChargesPerMLD * (waterRequirementMLD || 0);
    return this.totalBaseFee + ecCharges;
};

// Ensure virtuals are included
FeeStructureSchema.set("toJSON", { virtuals: true });
FeeStructureSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("FeeStructure", FeeStructureSchema);
