const mongoose = require("mongoose");

const SelfComplianceSchema = new mongoose.Schema(
    {
        complianceId: {
            type: String,
            required: true,
            unique: true,
        },
        applicationId: {
            type: String, // Can be UUID or ObjectId string
            required: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        currentStep: {
            type: Number,
            default: 1,
            min: 1,
            max: 5
        },
        status: {
            type: String,
            enum: ["IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED"],
            default: "IN_PROGRESS"
        },

        // Structured data for each step
        stepData: {
            step1: {
                digitalFlowMetersInstalled: Boolean,
                meterCalibrationDone: Boolean,
                remarks: String
            },
            step2: {
                quarterlyReportsSubmitted: Boolean,
                dataAccurate: Boolean,
                remarks: String
            },
            step3: {
                rainwaterHarvestingImplemented: Boolean,
                rainwaterStructureFunctional: Boolean,
                remarks: String
            },
            step4: {
                extractionWithinLimits: Boolean,
                excessExtractionReason: String,
                remarks: String
            },
            step5: {
                nocConditionsMet: Boolean,
                anyViolations: Boolean,
                violationDetails: String,
                remarks: String
            }
        },

        // Linked documents for evidence
        documents: [
            {
                documentId: String,
                documentType: String, // "NOC_CERTIFICATE", "FLOW_METER_CALIBRATION", etc.
                uploadedAt: { type: Date, default: Date.now }
            }
        ],

        // AI Auto-Validation Results
        validationResult: {
            autoStatus: {
                type: String,
                enum: ["AUTO_APPROVED", "NEEDS_REVIEW", "REJECTED", "PENDING"],
                default: "PENDING"
            },
            score: { type: Number, default: 0 },
            criticalIssues: [String],
            validatedAt: Date
        }
    },
    {
        timestamps: true,
    }
);

// Indexes
SelfComplianceSchema.index({ complianceId: 1 });
SelfComplianceSchema.index({ applicationId: 1 });

module.exports = mongoose.model("SelfCompliance", SelfComplianceSchema);
