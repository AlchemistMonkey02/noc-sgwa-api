const mongoose = require('mongoose');

const SelfComplianceSchema = new mongoose.Schema(
    {
        complianceId: {
            type: String,
            required: true,
            unique: true,
        },
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NOCApplication',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        currentStep: {
            type: Number,
            default: 1,
        },
        totalSteps: {
            type: Number,
            default: 5,
        },
        // Step-wise responses
        responses: {
            step1: {
                digitalFlowMetersInstalled: { type: Boolean },
                meterCalibrationDone: { type: Boolean },
                remarks: { type: String },
            },
            step2: {
                quarterlyReportsSubmitted: { type: Boolean },
                dataAccurate: { type: Boolean },
                remarks: { type: String },
            },
            step3: {
                rainwaterHarvestingImplemented: { type: Boolean },
                rainwaterStructureFunctional: { type: Boolean },
                remarks: { type: String },
            },
            step4: {
                extractionWithinLimits: { type: Boolean },
                excessExtractionReason: { type: String },
                remarks: { type: String },
            },
            step5: {
                nocConditionsMet: { type: Boolean },
                anyViolations: { type: Boolean },
                violationDetails: { type: String },
                remarks: { type: String },
            },
        },
        // Uploaded documents
        documents: [
            {
                type: {
                    type: String,
                    enum: [
                        'NOC_CERTIFICATE',
                        'FLOW_METER_CALIBRATION',
                        'QUARTERLY_DATA',
                        'RAINWATER_PHOTOS',
                        'OTHER'
                    ],
                },
                fileName: String,
                filePath: String,
                uploadedAt: { type: Date, default: Date.now },
            },
        ],
        // Auto-validation result
        autoValidationResult: {
            status: {
                type: String,
                enum: ['PENDING', 'AUTO_APPROVED', 'AUTO_REJECTED', 'MANUAL_REVIEW_REQUIRED'],
                default: 'PENDING',
            },
            score: { type: Number }, // 0-100
            criticalIssues: [String],
            warnings: [String],
            validatedAt: Date,
        },
        status: {
            type: String,
            enum: ['DRAFT', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED'],
            default: 'DRAFT',
        },
        submittedAt: Date,
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: Date,
        reviewRemarks: String,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('SelfCompliance', SelfComplianceSchema);
