const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
    {
        paymentId: {
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

        amount: {
            type: Number,
            required: true,
        },
        paymentMode: {
            type: String,
            enum: ["ONLINE", "OFFLINE", "CHALLAN"],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
            default: "PENDING",
            index: true,
        },

        // Online Payment
        transactionId: String,
        gatewayResponse: mongoose.Schema.Types.Mixed,

        // Offline Payment
        challanNumber: String,
        bankName: String,
        depositDate: Date,
        depositSlip: String, // document path

        // Verification (for offline)
        isVerified: {
            type: Boolean,
            default: false,
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        verifiedAt: Date,
    },
    {
        timestamps: true,
    }
);

// Indexes
PaymentSchema.index({ paymentId: 1 });
PaymentSchema.index({ applicationId: 1 });
PaymentSchema.index({ userId: 1, paymentStatus: 1 });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payment", PaymentSchema);
