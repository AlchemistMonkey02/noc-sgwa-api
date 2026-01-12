const mongoose = require("mongoose");

const NOCCertificateSchema = new mongoose.Schema(
    {
        nocId: {
            type: String,
            required: true,
            unique: true,
        },
        nocNumber: {
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
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
            index: true,
        },

        // Certificate Details
        issueDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        validFrom: {
            type: Date,
            required: true,
        },
        validUpto: {
            type: Date,
            required: true,
        },
        validityYears: {
            type: Number,
            required: true,
        },

        // Approved Details
        approvedWaterQuantity: {
            type: Number, // MLD
            required: true,
        },
        conditions: [String],
        restrictions: [String],

        // Approval
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },

        // Status
        status: {
            type: String,
            enum: ["ACTIVE", "EXPIRED", "SUSPENDED", "CANCELLED"],
            default: "ACTIVE",
            index: true,
        },

        // QR Code & PDF
        qrCode: String, // base64 or URL
        certificatePDF: String, // file path
    },
    {
        timestamps: true,
    }
);

// Indexes
NOCCertificateSchema.index({ nocNumber: 1 });
NOCCertificateSchema.index({ userId: 1, status: 1 });
NOCCertificateSchema.index({ validUpto: 1 });

// Auto-generate NOC number
// Auto-generate NOC number
NOCCertificateSchema.pre("save", async function () {
    if (this.isNew && !this.nocNumber) {
        const count = await this.constructor.countDocuments();
        const year = new Date().getFullYear();
        this.nocNumber = `NOC/CERT/${year}/${String(count + 1).padStart(5, "0")}`;
    }
});

// Virtual for checking if expired
NOCCertificateSchema.virtual("isExpired").get(function () {
    return new Date() > this.validUpto;
});

// Ensure virtuals are included
NOCCertificateSchema.set("toJSON", { virtuals: true });
NOCCertificateSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("NOCCertificate", NOCCertificateSchema);
