const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const OwnerDetailsSchema = new mongoose.Schema({
    ownerName: { type: String, required: true },
    ownerPhone: { type: String, required: true },
    ownerEmail: { type: String, required: true }, // Verified vs prompt "sakethospitaljaipur@gmail.com"
    ownerAddress: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: false },
    pinCode: { type: String, required: true }
}, { _id: false });

const AgriculturalDetailsSchema = new mongoose.Schema({
    state: { type: String, required: true },
    district: { type: String, required: false },
    assessmentUnitBlockTehsil: { type: String, required: true }, // e.g. "AMBER (Status: OVER EXPLOITED)"
    address: { type: String, required: true },
    pinCode: { type: String, required: true },
    landHoldingAreaHectare: { type: Number, required: true },
    landDetailsKhasraNo: { type: String, required: true },
    gramPanchayatName: { type: String, required: true },
    waterRequirementKLD: { type: Number, required: true }
}, { _id: false });

const NocExemptionApplicationSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 }, // Using UUID as PK
    applicationType: { type: String, required: true }, // "Agriculture Activities"
    applicationSubType: { type: String },
    groundWaterRequirementFor: { type: String },
    waterQualityType: { type: String, required: true },
    applicationForBoring: { type: String },
    dateOfBoring: { type: Date },

    groundWaterUsage: {
        drinkingDomestic: { type: Boolean, default: false },
        agricultureUse: { type: Boolean, default: false }
    },

    ownerDetails: { type: OwnerDetailsSchema, required: true },
    agriculturalDetails: { type: AgriculturalDetailsSchema, required: false }, // Optional if not agriculture? But core use case is.

    status: {
        type: String,
        enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"],
        default: "DRAFT"
    },
    exemptionEligible: { type: Boolean, default: false },

    // Future proofing for documents if needed
    documents: [{
        docType: String,
        url: String,
        uploadedAt: Date
    }]

}, {
    timestamps: true, // created_at, updated_at
    collection: "noc_exemption_applications" // Explicit table name match
});

module.exports = mongoose.model("NocExemptionApplication", NocExemptionApplicationSchema);
