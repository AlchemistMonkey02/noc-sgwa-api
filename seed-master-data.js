const mongoose = require("mongoose");
require("dotenv").config();
const MasterData = require("./app/master-data/master-data.model");

const masterValues = [
    // Application Types
    { type: "APPLICATION_TYPE", code: "NEW", label: "New Application", displayOrder: 1 },
    { type: "APPLICATION_TYPE", code: "RENEWAL", label: "Renewal", displayOrder: 2 },
    { type: "APPLICATION_TYPE", code: "AMENDMENT", label: "Amendment", displayOrder: 3 },

    // Application Sub Types
    { type: "APPLICATION_SUB_TYPE", code: "GW_EXTRACTION", label: "Ground Water Extraction", displayOrder: 1 },
    { type: "APPLICATION_SUB_TYPE", code: "DEWATERING", label: "Dewatering", displayOrder: 2 },

    // Project Types
    { type: "PROJECT_TYPE", code: "IND", label: "Industrial", displayOrder: 1 },
    { type: "PROJECT_TYPE", code: "INFRA", label: "Infrastructure", displayOrder: 2 },
    { type: "PROJECT_TYPE", code: "MINING", label: "Mining", displayOrder: 3 },

    // Water Quality Types
    { type: "WATER_QUALITY_TYPE", code: "FRESH", label: "Fresh Water", displayOrder: 1 },
    { type: "WATER_QUALITY_TYPE", code: "SALINE", label: "Saline Water", displayOrder: 2 },

    // Utilization Purposes
    { type: "UTILIZATION_PURPOSE", code: "IND_USE", label: "Industrial Use", displayOrder: 1 },
    { type: "UTILIZATION_PURPOSE", code: "DOM_USE", label: "Domestic Use", displayOrder: 2 },
    { type: "UTILIZATION_PURPOSE", code: "COMM_USE", label: "Commercial Use", displayOrder: 3 },

    // Organization Types
    { type: "ORGANIZATION_TYPE", code: "GOVT", label: "Government", displayOrder: 1 },
    { type: "ORGANIZATION_TYPE", code: "PSU", label: "Public Sector Undertaking", displayOrder: 2 },
    { type: "ORGANIZATION_TYPE", code: "PVT_LTD", label: "Private Limited Company", displayOrder: 3 },
    { type: "ORGANIZATION_TYPE", code: "LTD", label: "Public Limited Company", displayOrder: 4 },
    { type: "ORGANIZATION_TYPE", code: "PARTNERSHIP", label: "Partnership Firm", displayOrder: 5 },
    { type: "ORGANIZATION_TYPE", code: "PROPRIETORSHIP", label: "Proprietorship", displayOrder: 6 },
    { type: "ORGANIZATION_TYPE", code: "TRUST_NGO", label: "Trust/NGO", displayOrder: 7 },
    { type: "ORGANIZATION_TYPE", code: "INDIVIDUAL", label: "Individual", displayOrder: 8 },

    // MSME Types
    { type: "MSME_TYPE", code: "MICRO", label: "Micro Enterprise", displayOrder: 1 },
    { type: "MSME_TYPE", code: "SMALL", label: "Small Enterprise", displayOrder: 2 },
    { type: "MSME_TYPE", code: "MEDIUM", label: "Medium Enterprise", displayOrder: 3 },

    // Project Categories (New Comprehensive List)
    { type: "PROJECT_CATEGORY", code: "PC01", label: "Infrastructure", displayOrder: 1 },
    { type: "PROJECT_CATEGORY", code: "PC02", label: "Water Resources", displayOrder: 2 },
    { type: "PROJECT_CATEGORY", code: "PC03", label: "Environmental", displayOrder: 3 },
    { type: "PROJECT_CATEGORY", code: "PC04", label: "Construction", displayOrder: 4 },
    { type: "PROJECT_CATEGORY", code: "PC05", label: "Industrial", displayOrder: 5 },
    { type: "PROJECT_CATEGORY", code: "PC06", label: "Energy", displayOrder: 6 },
    { type: "PROJECT_CATEGORY", code: "PC07", label: "Mining", displayOrder: 7 },
    { type: "PROJECT_CATEGORY", code: "PC08", label: "Agriculture", displayOrder: 8 },
    { type: "PROJECT_CATEGORY", code: "PC09", label: "Urban Development", displayOrder: 9 },
    { type: "PROJECT_CATEGORY", code: "PC10", label: "Rural Development", displayOrder: 10 },
    { type: "PROJECT_CATEGORY", code: "PC11", label: "Healthcare", displayOrder: 11 },
    { type: "PROJECT_CATEGORY", code: "PC12", label: "Education", displayOrder: 12 },
    { type: "PROJECT_CATEGORY", code: "PC13", label: "Commercial", displayOrder: 13 },
    { type: "PROJECT_CATEGORY", code: "PC14", label: "Residential", displayOrder: 14 },
    { type: "PROJECT_CATEGORY", code: "PC15", label: "Government", displayOrder: 15 },
    { type: "PROJECT_CATEGORY", code: "PC16", label: "Transport", displayOrder: 16 },
    { type: "PROJECT_CATEGORY", code: "PC17", label: "Telecom & IT", displayOrder: 17 },
    { type: "PROJECT_CATEGORY", code: "PC18", label: "Tourism", displayOrder: 18 },
    { type: "PROJECT_CATEGORY", code: "PC19", label: "Renewable Resources", displayOrder: 19 },
    { type: "PROJECT_CATEGORY", code: "PC20", label: "Other", displayOrder: 20 },

    // Geology Types
    { type: "GEOLOGY_TYPE", code: "ALLUVIUM", label: "Alluvium", displayOrder: 1 },
    { type: "GEOLOGY_TYPE", code: "HARD_ROCK", label: "Hard Rock", displayOrder: 2 },
    { type: "GEOLOGY_TYPE", code: "SOFT_ROCK", label: "Soft Rock", displayOrder: 3 },
    { type: "GEOLOGY_TYPE", code: "SANDSTONE", label: "Sandstone", displayOrder: 4 },
    { type: "GEOLOGY_TYPE", code: "LIMESTONE", label: "Limestone", displayOrder: 5 },

    // Meter Types
    { type: "METER_TYPE", code: "MAGNETIC", label: "Electromagnetic", displayOrder: 1 },
    { type: "METER_TYPE", code: "ULTRASONIC", label: "Ultrasonic", displayOrder: 2 },
    { type: "METER_TYPE", code: "ULTRASONIC", label: "Ultrasonic", displayOrder: 2 },
    { type: "METER_TYPE", code: "MECHANICAL", label: "Mechanical", displayOrder: 3 },

    // Area Categories
    { type: "AREA_CATEGORY", code: "SAFE", label: "Safe", displayOrder: 1 },
    { type: "AREA_CATEGORY", code: "SEMI_CRITICAL", label: "Semi Critical", displayOrder: 2 },
    { type: "AREA_CATEGORY", code: "CRITICAL", label: "Critical", displayOrder: 3 },
    { type: "AREA_CATEGORY", code: "OVER_EXPLOITED", label: "Over Exploited", displayOrder: 4 },
    { type: "AREA_CATEGORY", code: "SALINE", label: "Saline", displayOrder: 5 },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB...");

        // Optional: clear specific types if fully replacing
        await MasterData.deleteMany({ type: "PROJECT_CATEGORY" });

        for (const item of masterValues) {
            await MasterData.findOneAndUpdate(
                { type: item.type, code: item.code },
                item,
                { upsert: true, new: true }
            );
        }

        console.log("Master Data seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
