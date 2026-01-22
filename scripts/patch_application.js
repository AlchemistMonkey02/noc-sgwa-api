require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('../app/config/db.config');
const NOCApplication = require('../app/noc/noc-application.model');

async function patchApplication() {
    try {
        await mongoose.connect(dbConfig.url);

        const appId = "696385af85ba8d751b6f1d3a";

        console.log(`Patching application ${appId}...`);

        const update = {
            sectorType: "INDUSTRIAL",
            "waterRequirement.purpose": "Industrial Use",
            "waterRequirement.proposedExtraction.numberOfBorewells": 1,
            "conservationMeasures.rainwaterHarvesting.implemented": true,
            "digitalFlowMeter.meterType": "DIGITAL_FLOW_METER_WITH_TELEMETRY",
            undertakings: {
                penaltyAcceptance: true,
                inspectionConsent: true,
                waterMeterInstallation: true,
                complianceAgreement: true,
                informationAccuracy: true,
                undertakingDate: new Date(),
                undertakingPlace: "Jaipur"
            },
            // Ensure location fields if missing (based on potential other errors)
            "location.stateId": "RAJ",
            "location.districtId": "JAIPUR",
            "location.blockId": "SANGANER"
        };

        // Use findOneAndUpdate to bypass validation during the patch itself, 
        // effectively "forcing" the data into a valid state for the next save().
        const app = await NOCApplication.findByIdAndUpdate(
            appId,
            { $set: update },
            { new: true, runValidators: false }
        );

        if (app) {
            console.log("SUCCESS: Application patched with required fields.");
        } else {
            console.log("Application not found.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

patchApplication();
