const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const dbConfig = require("../app/config/db.config");
const MasterData = require("../app/master-data/master-data.model");

const SECTOR_TYPES = [
    { code: "INDUSTRY", label: "Industry" },
    { code: "INFRASTRUCTURE", label: "Infrastructure" },
    { code: "MINING", label: "Mining" },
    { code: "AGRICULTURE", label: "Agriculture" }
];

const seedSectorTypes = async () => {
    try {
        await mongoose.connect(dbConfig.url);
        console.log("Connected to MongoDB");

        console.log("Seeding Sector Types...");

        for (const sector of SECTOR_TYPES) {
            await MasterData.findOneAndUpdate(
                { type: "SECTOR_TYPE", code: sector.code },
                {
                    type: "SECTOR_TYPE",
                    code: sector.code,
                    label: sector.label,
                    isActive: true,
                    displayOrder: 0
                },
                { upsert: true, new: true }
            );
            console.log(`Processes: ${sector.label}`);
        }

        console.log("✅ Sector Types seeded successfully");
        process.exit(0);
    } catch (error) {
        console.error("❌ Link Error:", error);
        process.exit(1);
    }
};

seedSectorTypes();
