require("dotenv").config();
const mongoose = require("mongoose");
const dbConfig = require("../app/config/db.config");

// Import models
const State = require("../app/master-data/state.model");
const District = require("../app/master-data/district.model");
const Block = require("../app/master-data/block.model");
const IndustryType = require("../app/master-data/industry-type.model");
const DocumentRequirement = require("../app/master-data/document-requirement.model");
const FeeStructure = require("../app/master-data/fee-structure.model");

// Connect to MongoDB
mongoose
    .connect(dbConfig.url)
    .then(() => console.log("✓ Connected to MongoDB"))
    .catch((err) => {
        console.error("✗ MongoDB connection error:", err);
        process.exit(1);
    });

// Seed data
const seedMasterData = async () => {
    try {
        console.log("\n🌱 Starting master data seeding...\n");

        // 1. Seed States
        console.log("📍 Seeding states...");
        await State.deleteMany({});
        const states = await State.insertMany([
            {
                stateId: "RAJ",
                stateName: "Rajasthan",
                stateCode: "RJ",
            },
        ]);
        console.log(`   ✓ Created ${states.length} state(s)`);

        // 2. Seed Districts (33 districts of Rajasthan)
        console.log("\n🏙️  Seeding districts...");
        await District.deleteMany({});
        const districts = await District.insertMany([
            { districtId: "JAIPUR", districtName: "Jaipur", districtCode: "JP", stateId: "RAJ" },
            { districtId: "JODHPUR", districtName: "Jodhpur", districtCode: "JD", stateId: "RAJ" },
            { districtId: "KOTA", districtName: "Kota", districtCode: "KT", stateId: "RAJ" },
            { districtId: "BIKANER", districtName: "Bikaner", districtCode: "BK", stateId: "RAJ" },
            { districtId: "AJMER", districtName: "Ajmer", districtCode: "AJ", stateId: "RAJ" },
            { districtId: "UDAIPUR", districtName: "Udaipur", districtCode: "UD", stateId: "RAJ" },
            { districtId: "BHILWARA", districtName: "Bhilwara", districtCode: "BH", stateId: "RAJ" },
            { districtId: "ALWAR", districtName: "Alwar", districtCode: "AL", stateId: "RAJ" },
            { districtId: "BHARATPUR", districtName: "Bharatpur", districtCode: "BR", stateId: "RAJ" },
            { districtId: "PALI", districtName: "Pali", districtCode: "PA", stateId: "RAJ" },
            { districtId: "BARMER", districtName: "Barmer", districtCode: "BM", stateId: "RAJ" },
            { districtId: "NAGAUR", districtName: "Nagaur", districtCode: "NG", stateId: "RAJ" },
            { districtId: "CHITTORGARH", districtName: "Chittorgarh", districtCode: "CG", stateId: "RAJ" },
            { districtId: "SIKAR", districtName: "Sikar", districtCode: "SI", stateId: "RAJ" },
            { districtId: "HANUMANGARH", districtName: "Hanumangarh", districtCode: "HN", stateId: "RAJ" },
            { districtId: "GANGANAGAR", districtName: "Sri Ganganagar", districtCode: "GG", stateId: "RAJ" },
            { districtId: "JHUNJHUNU", districtName: "Jhunjhunu", districtCode: "JH", stateId: "RAJ" },
            { districtId: "TONK", districtName: "Tonk", districtCode: "TK", stateId: "RAJ" },
            { districtId: "BUNDI", districtName: "Bundi", districtCode: "BU", stateId: "RAJ" },
            { districtId: "SAWAIMADHOPUR", districtName: "Sawai Madhopur", districtCode: "SM", stateId: "RAJ" },
            { districtId: "JHALAWAR", districtName: "Jhalawar", districtCode: "JW", stateId: "RAJ" },
            { districtId: "DUNGARPUR", districtName: "Dungarpur", districtCode: "DG", stateId: "RAJ" },
            { districtId: "BANSWARA", districtName: "Banswara", districtCode: "BW", stateId: "RAJ" },
            { districtId: "CHURU", districtName: "Churu", districtCode: "CH", stateId: "RAJ" },
            { districtId: "DAUSA", districtName: "Dausa", districtCode: "DA", stateId: "RAJ" },
            { districtId: "KARAULI", districtName: "Karauli", districtCode: "KR", stateId: "RAJ" },
            { districtId: "DHOLPUR", districtName: "Dholpur", districtCode: "DH", stateId: "RAJ" },
            { districtId: "RAJSAMAND", districtName: "Rajsamand", districtCode: "RS", stateId: "RAJ" },
            { districtId: "PRATAPGARH", districtName: "Pratapgarh", districtCode: "PR", stateId: "RAJ" },
            { districtId: "SIROHI", districtName: "Sirohi", districtCode: "SR", stateId: "RAJ" },
            { districtId: "JALORE", districtName: "Jalore", districtCode: "JL", stateId: "RAJ" },
            { districtId: "BARAN", districtName: "Baran", districtCode: "BA", stateId: "RAJ" },
            { districtId: "JAISALMER", districtName: "Jaisalmer", districtCode: "JS", stateId: "RAJ" },
        ]);
        console.log(`   ✓ Created ${districts.length} district(s)`);

        // 3. Seed Sample Blocks
        console.log("\n🏘️  Seeding sample blocks...");
        await Block.deleteMany({});
        const blocks = await Block.insertMany([
            {
                blockId: "JAIPUR_BLOCK1",
                blockName: "Jaipur Block 1",
                blockCode: "JP01",
                districtId: "JAIPUR",
                category: "SAFE",
                categoryCriteria: {
                    dynamicGroundWaterResource: 10000,
                    annualGroundWaterExtraction: 5000,
                    stageOfExtraction: 50,
                },
            },
            {
                blockId: "JAIPUR_BLOCK2",
                blockName: "Jaipur Block 2",
                blockCode: "JP02",
                districtId: "JAIPUR",
                category: "SEMI_CRITICAL",
                categoryCriteria: {
                    dynamicGroundWaterResource: 8000,
                    annualGroundWaterExtraction: 6500,
                    stageOfExtraction: 81.25,
                },
            },
            {
                blockId: "JODHPUR_BLOCK1",
                blockName: "Jodhpur Block 1",
                blockCode: "JD01",
                districtId: "JODHPUR",
                category: "CRITICAL",
                categoryCriteria: {
                    dynamicGroundWaterResource: 5000,
                    annualGroundWaterExtraction: 4700,
                    stageOfExtraction: 94,
                },
            },
            {
                blockId: "BIKANER_BLOCK1",
                blockName: "Bikaner Block 1",
                blockCode: "BK01",
                districtId: "BIKANER",
                category: "OVER_EXPLOITED",
                categoryCriteria: {
                    dynamicGroundWaterResource: 3000,
                    annualGroundWaterExtraction: 3500,
                    stageOfExtraction: 116.67,
                },
            },
        ]);
        console.log(`   ✓ Created ${blocks.length} block(s)`);

        // 4. Seed Industry Types
        console.log("\n🏭 Seeding industry types...");
        await IndustryType.deleteMany({});
        const industryTypes = await IndustryType.insertMany([
            {
                industryTypeId: "AGRICULTURE",
                industryName: "Agriculture",
                category: "AGRICULTURE",
                description: "Agricultural farming and irrigation",
                requiredDocuments: ["LAND_OWNERSHIP", "KHASRA_KHATAUNI"],
                waterRequirement: { min: 1, max: 50 },
            },
            {
                industryTypeId: "TEXTILE",
                industryName: "Textile Industry",
                category: "MANUFACTURING",
                description: "Textile manufacturing and processing",
                requiredDocuments: ["FACTORY_LICENSE", "POLLUTION_NOC", "LAND_OWNERSHIP"],
                waterRequirement: { min: 5, max: 100 },
            },
            {
                industryTypeId: "HOTEL",
                industryName: "Hotel & Hospitality",
                category: "HOSPITALITY",
                description: "Hotels, resorts, and hospitality establishments",
                requiredDocuments: ["TRADE_LICENSE", "BUILDING_PLAN", "LAND_OWNERSHIP"],
                waterRequirement: { min: 2, max: 20 },
            },
            {
                industryTypeId: "HOSPITAL",
                industryName: "Hospital & Healthcare",
                category: "HEALTHCARE",
                description: "Hospitals and healthcare facilities",
                requiredDocuments: ["HOSPITAL_LICENSE", "BUILDING_PLAN", "LAND_OWNERSHIP"],
                waterRequirement: { min: 3, max: 30 },
            },
            {
                industryTypeId: "MINING",
                industryName: "Mining & Quarrying",
                category: "MINING",
                description: "Mining and quarrying operations",
                requiredDocuments: ["MINING_LEASE", "POLLUTION_NOC", "ENVIRONMENTAL_CLEARANCE"],
                waterRequirement: { min: 10, max: 200 },
            },
        ]);
        console.log(`   ✓ Created ${industryTypes.length} industry type(s)`);

        // 5. Seed Document Requirements
        console.log("\n📄 Seeding document requirements...");
        await DocumentRequirement.deleteMany({});
        const documents = await DocumentRequirement.insertMany([
            {
                documentId: "LAND_OWNERSHIP",
                documentName: "Land Ownership Proof",
                documentType: "OWNERSHIP_PROOF",
                applicationType: "ALL",
                isMandatory: true,
                description: "Proof of land ownership (Registry, Sale Deed, etc.)",
                maxFileSize: 5,
                allowedFormats: ["pdf", "jpg", "png"],
            },
            {
                documentId: "AADHAR_CARD",
                documentName: "Aadhar Card",
                documentType: "IDENTITY_PROOF",
                applicationType: "ALL",
                isMandatory: true,
                description: "Applicant's Aadhar card",
                maxFileSize: 2,
                allowedFormats: ["pdf", "jpg", "png"],
            },
            {
                documentId: "PAN_CARD",
                documentName: "PAN Card",
                documentType: "IDENTITY_PROOF",
                applicationType: "NEW_NOC",
                isMandatory: true,
                description: "PAN card of applicant/company",
                maxFileSize: 2,
                allowedFormats: ["pdf", "jpg", "png"],
            },
            {
                documentId: "KHASRA_KHATAUNI",
                documentName: "Khasra Khatauni",
                documentType: "OWNERSHIP_PROOF",
                applicationType: "NEW_NOC",
                isMandatory: true,
                description: "Khasra Khatauni of the land",
                maxFileSize: 5,
                allowedFormats: ["pdf"],
            },
            {
                documentId: "SITE_PLAN",
                documentName: "Site Plan",
                documentType: "PLAN",
                applicationType: "NEW_NOC",
                isMandatory: true,
                description: "Detailed site plan with borewell location",
                maxFileSize: 10,
                allowedFormats: ["pdf", "dwg"],
            },
            {
                documentId: "POLLUTION_NOC",
                documentName: "Pollution NOC",
                documentType: "NOC",
                applicationType: "NEW_NOC",
                isMandatory: false,
                description: "NOC from Pollution Control Board (if applicable)",
                maxFileSize: 5,
                allowedFormats: ["pdf"],
            },
        ]);
        console.log(`   ✓ Created ${documents.length} document requirement(s)`);

        // 6. Seed Fee Structures
        console.log("\n💰 Seeding fee structures...");
        await FeeStructure.deleteMany({});
        const fees = await FeeStructure.insertMany([
            {
                feeId: "FEE_NEW_SAFE",
                applicationType: "NEW_NOC",
                blockCategory: "SAFE",
                baseAmount: 5000,
                ecChargesPerMLD: 1000,
                waterBudgetCharges: 500,
                processingFee: 200,
                inspectionFee: 300,
                validityPeriod: { years: 3, description: "Valid for 3 years" },
                description: "Fee for new NOC in SAFE category blocks",
                effectiveFrom: new Date("2024-01-01"),
                effectiveTo: null,
            },
            {
                feeId: "FEE_NEW_SEMI",
                applicationType: "NEW_NOC",
                blockCategory: "SEMI_CRITICAL",
                baseAmount: 10000,
                ecChargesPerMLD: 2000,
                waterBudgetCharges: 1000,
                processingFee: 500,
                inspectionFee: 500,
                validityPeriod: { years: 3, description: "Valid for 3 years" },
                description: "Fee for new NOC in SEMI_CRITICAL category blocks",
                effectiveFrom: new Date("2024-01-01"),
                effectiveTo: null,
            },
            {
                feeId: "FEE_NEW_CRITICAL",
                applicationType: "NEW_NOC",
                blockCategory: "CRITICAL",
                baseAmount: 15000,
                ecChargesPerMLD: 3000,
                waterBudgetCharges: 1500,
                processingFee: 1000,
                inspectionFee: 1000,
                validityPeriod: { years: 1, description: "Valid for 1 year only" },
                description: "Fee for new NOC in CRITICAL category blocks",
                effectiveFrom: new Date("2024-01-01"),
                effectiveTo: null,
            },
            {
                feeId: "FEE_RENEWAL",
                applicationType: "RENEWAL",
                blockCategory: "ALL",
                baseAmount: 3000,
                ecChargesPerMLD: 500,
                waterBudgetCharges: 300,
                processingFee: 200,
                inspectionFee: 200,
                validityPeriod: { years: 3, description: "Renewal for 3 years" },
                description: "Fee for NOC renewal (all categories)",
                effectiveFrom: new Date("2024-01-01"),
                effectiveTo: null,
            },
        ]);
        console.log(`   ✓ Created ${fees.length} fee structure(s)`);

        console.log("\n✅ Master data seeding completed successfully!\n");
        console.log("Summary:");
        console.log(`  - States: ${states.length}`);
        console.log(`  - Districts: ${districts.length}`);
        console.log(`  - Blocks: ${blocks.length}`);
        console.log(`  - Industry Types: ${industryTypes.length}`);
        console.log(`  - Document Requirements: ${documents.length}`);
        console.log(`  - Fee Structures: ${fees.length}`);
        console.log("");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error seeding master data:", error);
        process.exit(1);
    }
};

// Run seeder
seedMasterData();
