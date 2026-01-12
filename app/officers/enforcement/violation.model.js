const mongoose = require("mongoose");

const ViolationSchema = new mongoose.Schema({
    violationId: { type: String, required: true, unique: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'NOCApplication' },
    nocCertificateId: { type: mongoose.Schema.Types.ObjectId, ref: 'NOCCertificate' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

    type: { type: String, enum: ['WARNING', 'PENALTY', 'CANCELLATION_NOTICE'], required: true },
    violationType: { type: String, required: true }, // e.g., METER_TAMPERING

    description: String,

    // For Penalty
    amount: Number,
    isPaid: { type: Boolean, default: false },
    paymentDate: Date,

    // Status
    status: { type: String, enum: ['OPEN', 'RESOLVED', 'CONTESTED'], default: 'OPEN' },

    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issuedAt: { type: Date, default: Date.now },

    resolvedAt: Date,
    resolutionRemarks: String
}, { timestamps: true });

module.exports = mongoose.model("Violation", ViolationSchema);
