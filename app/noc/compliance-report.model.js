const mongoose = require('mongoose');

const ComplianceReportSchema = new mongoose.Schema(
    {
        reportId: {
            type: String,
            required: true,
            unique: true,
        },
        nocId: {
            type: String,
            required: true,
        },
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NOCApplication',
            required: true,
        },
        applicationNumber: {
            type: String,
            required: true,
        },
        nocNumber: {
            type: String,
        },
        reportingYear: {
            type: String,
            required: true,
            // Format: "YYYY-YYYY" (e.g., "2025-2026")
        },
        submittedDate: {
            type: Date,
            default: Date.now,
        },
        lastUpdatedDate: {
            type: Date,
        },
        complianceStatus: {
            type: String,
            enum: ['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL'],
            required: true,
        },
        isRebateClaimed: {
            type: Boolean,
            default: false,
        },
        remarks: {
            type: String,
        },
        reportFileUrl: {
            type: String,
        },
        reportFileName: {
            type: String,
        },
        acknowledgmentNumber: {
            type: String,
            unique: true,
            sparse: true,
        },
        waterExtractionData: {
            q1: { type: Number }, // Quarter 1 extraction (m³)
            q2: { type: Number },
            q3: { type: Number },
            q4: { type: Number },
            totalAnnual: { type: Number },
            unit: { type: String, default: 'm³' },
        },
        reviewStatus: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'CLARIFICATION_NEEDED'],
            default: 'PENDING',
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewDate: {
            type: Date,
        },
        reviewRemarks: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['DRAFT', 'SUBMITTED', 'UPDATED', 'REVIEWED'],
            default: 'SUBMITTED',
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for unique reports per NOC per year
ComplianceReportSchema.index({ nocId: 1, reportingYear: 1 }, { unique: true });

module.exports = mongoose.model('ComplianceReport', ComplianceReportSchema);
