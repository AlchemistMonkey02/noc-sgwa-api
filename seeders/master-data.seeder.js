const mongoose = require("mongoose");
const dotenv = require("dotenv");
const MasterData = require("../app/master-data/master-data.model");

dotenv.config();

const masterData = [
    // Application Types
    { type: "APPLICATION_TYPE", code: "NEW", label: "New Application" },
    { type: "APPLICATION_TYPE", code: "RENEWAL", label: "Renewal" },
    { type: "APPLICATION_TYPE", code: "AMENDMENT", label: "Amendment" },

    // Application Sub Types
    { type: "APPLICATION_SUB_TYPE", code: "MAJOR", label: "Major Project" },
    { type: "APPLICATION_SUB_TYPE", code: "MINOR", label: "Minor Project" },
    { type: "APPLICATION_SUB_TYPE", code: "EXPANSION", label: "Expansion" },

    // Project Types
    { type: "PROJECT_TYPE", code: "INDUSTRIAL", label: "Industrial" },
    { type: "PROJECT_TYPE", code: "INFRASTRUCTURE", label: "Infrastructure" },
    { type: "PROJECT_TYPE", code: "MINING", label: "Mining" },

    // Water Quality Types
    { type: "WATER_QUALITY_TYPE", code: "FRESH", label: "Fresh Water" },
    { type: "WATER_QUALITY_TYPE", code: "SALINE", label: "Saline Water" },
    { type: "WATER_QUALITY_TYPE", code: "BRACKISH", label: "Brackish Water" },

    // Utilization Purposes
    { type: "UTILIZATION_PURPOSE", code: "INDUSTRIAL", label: "Industrial Use" },
    { type: "UTILIZATION_PURPOSE", code: "DOMESTIC", label: "Domestic Use" },
    { type: "UTILIZATION_PURPOSE", code: "AGRICULTURE", label: "Agriculture" },
    { type: "UTILIZATION_PURPOSE", code: "COMMERCIAL", label: "Commercial Use" },

    // MSME Types
    { type: "MSME_TYPE", code: "MICRO", label: "Micro" },
    { type: "MSME_TYPE", code: "SMALL", label: "Small" },
    { type: "MSME_TYPE", code: "MEDIUM", label: "Medium" }
];

const seedMasterData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/sgwa_db");
        console.log("Connected to MongoDB via Mongoose");

        // Upsert data to avoid duplicates
        for (const item of masterData) {
            await MasterData.findOneAndUpdate(
                { type: item.type, code: item.code },
                item,
                { upsert: true, new: true }
            );
        }

        console.log("Master Data Seeded Successfully");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding master data:", error);
        process.exit(1);
    }
};

seedMasterData();
