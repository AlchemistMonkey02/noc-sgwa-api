const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const dbConfig = require("../app/config/db.config");
const IndustryType = require("../app/master-data/industry-type.model");

const INDUSTRY_TYPES = [
    // === AGRICULTURE ===
    {
        industryTypeId: "AGRI_001",
        industryName: "Agriculture",
        category: "AGRICULTURE",
        description: "General Agriculture"
    },
    {
        industryTypeId: "AGRI_002",
        industryName: "Horticulture",
        category: "AGRICULTURE",
        description: "Cultivation of plants starting from seeds"
    },

    // === INDUSTRY (Generic) ===
    {
        industryTypeId: "IND_001",
        industryName: "Textile",
        category: "MANUFACTURING",
        description: "Textile manufacturing and processing"
    },
    {
        industryTypeId: "IND_002",
        industryName: "Food Processing",
        category: "MANUFACTURING",
        description: "Processing of food products"
    },
    {
        industryTypeId: "IND_003",
        industryName: "Chemical",
        category: "MANUFACTURING",
        description: "Manufacture of chemicals and chemical products"
    },
    {
        industryTypeId: "IND_004",
        industryName: "Pharmaceuticals",
        category: "MANUFACTURING",
        description: "Manufacturing of pharmaceutical products"
    },

    // === MINING ===
    {
        industryTypeId: "MIN_001",
        industryName: "Coal Mining",
        category: "MINING",
        description: "Mining of coal"
    },
    {
        industryTypeId: "MIN_002",
        industryName: "Stone Quarrying",
        category: "MINING",
        description: "Quarrying of stone, sand and clay"
    },
    {
        industryTypeId: "MIN_003",
        industryName: "Bauxite Mining",
        category: "MINING",
        description: "Mining of bauxite"
    },

    // === INFRASTRUCTURE ===
    {
        industryTypeId: "INFRA_001",
        industryName: "Residential Township",
        category: "CONSTRUCTION",
        description: "Large scale residential township projects"
    },
    {
        industryTypeId: "INFRA_002",
        industryName: "Commercial Complex",
        category: "CONSTRUCTION",
        description: "Shopping malls, office complexes"
    },
    {
        industryTypeId: "INFRA_003",
        industryName: "Hotels & Resorts",
        category: "HOSPITALITY",
        description: "Hotels, resorts and hospitality units"
    }
];

const seedIndustryTypes = async () => {
    try {
        await mongoose.connect(dbConfig.url);
        console.log("Connected to MongoDB");

        console.log("Seeding Industry Types...");

        for (const industry of INDUSTRY_TYPES) {
            await IndustryType.findOneAndUpdate(
                { industryTypeId: industry.industryTypeId },
                {
                    ...industry,
                    isActive: true
                },
                { upsert: true, new: true }
            );
            console.log(`Processed: ${industry.industryName} [${industry.category}]`);
        }

        console.log("✅ Industry Types seeded successfully");
        process.exit(0);
    } catch (error) {
        console.error("❌ Link Error:", error);
        process.exit(1);
    }
};

seedIndustryTypes();
