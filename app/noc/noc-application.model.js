const mongoose = require("mongoose");

const NOCApplicationSchema = new mongoose.Schema(
    {
        applicationId: {
            type: String,
            required: true,
            unique: true,
        },
        applicationNumber: {
            type: String,
            unique: true,
            sparse: true, // Only for submitted applications
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
            index: true,
        },

        // Application Type
        applicationType: {
            type: String,
            required: true,
            enum: ["NEW", "RENEWAL", "AMENDMENT"],
        },
        status: {
            type: String,
            required: true,
            enum: [
                "DRAFT",
                "SUBMITTED",
                "UNDER_REVIEW",
                "QUERY_RAISED",
                "QUERY_RESPONDED",
                "INSPECTION_SCHEDULED",
                "INSPECTED",
                "APPROVED",
                "REJECTED",
                "NOC_ISSUED",
                "WITHDRAWN",
            ],
            default: "DRAFT",
            index: true,
        },

        // Location Details
        location: {
            stateId: { type: String, required: true },
            districtId: { type: String, required: true },
            blockId: { type: String, required: true },
            blockCategory: String,
            village: String,
            address: String,
            pincode: String,
            latitude: Number,
            longitude: Number,
        },

        // Project Details
        projectDetails: {
            projectName: { type: String, required: true },
            industryType: String,
            projectDescription: String,
            landArea: Number, // sq meters
            builtUpArea: Number, // sq meters
        },

        // Water Requirements
        waterRequirement: {
            purpose: { type: String, required: true },
            dailyRequirement: { type: Number, required: true }, // MLD
            sourceType: {
                type: String,
                enum: ["BOREWELL", "TUBE_WELL", "OPEN_WELL"],
                required: true,
            },
            numberOfBorewells: Number,
            depth: Number, // meters
            pumpCapacity: Number, // HP
        },

        // Documents
        documents: [
            {
                documentId: String,
                documentType: String,
                isVerified: { type: Boolean, default: false },
            },
        ],

        // Fees
        feeDetails: {
            baseAmount: Number,
            ecCharges: Number,
            waterBudgetCharges: Number,
            processingFee: Number,
            inspectionFee: Number,
            totalAmount: Number,
            isPaid: { type: Boolean, default: false },
            paymentId: String,
        },

        // Assignment
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        assignedAt: Date,

        // Dates
        submittedAt: Date,
        approvedAt: Date,
        rejectedAt: Date,

        // Rejection
        rejectionReason: String,

        // NOC Certificate
        nocCertificateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NOCCertificate",
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
NOCApplicationSchema.index({ applicationNumber: 1 });
NOCApplicationSchema.index({ userId: 1, status: 1 });
NOCApplicationSchema.index({ "location.districtId": 1, "location.blockId": 1 });
NOCApplicationSchema.index({ assignedTo: 1, status: 1 });
NOCApplicationSchema.index({ createdAt: -1 });

// Auto-generate application number on submission
NOCApplicationSchema.pre("save", async function (next) {
    if (this.isModified("status") && this.status === "SUBMITTED" && !this.applicationNumber) {
        const count = await this.constructor.countDocuments({
            applicationNumber: { $exists: true },
        });
        const year = new Date().getFullYear();
        this.applicationNumber = `NOC/RAJ/${year}/${String(count + 1).padStart(5, "0")}`;
    }
    next();
});

module.exports = mongoose.model("NOCApplication", NOCApplicationSchema);
