const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema({
    complaintId: { type: String, required: true, unique: true },
    complainantName: { type: String, required: true }, // Can be anonymous or public
    complainantContact: String,

    targetEntityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, // Optional, if complaint against specific company
    targetApplicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'NOCApplication' },

    subject: { type: String, required: true },
    description: { type: String, required: true },
    location: {
        districtId: String,
        blockId: String,
        address: String
    },

    status: { type: String, enum: ['REGISTERED', 'INVESTIGATION_PENDING', 'RESOLVED', 'INVALID'], default: 'REGISTERED' },

    assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    investigationReport: String,

    resolvedAt: Date,
    resolutionRemarks: String,

    documents: [String] // URLs to proof/images
}, { timestamps: true });

module.exports = mongoose.model("Complaint", ComplaintSchema);
