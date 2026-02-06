const axios = require('axios');

const BASE_URL = "http://localhost:5000/api/noc/exemption/check-eligibility";

const scenarios = [
    {
        name: "1. Exempt Case: Agriculture",
        data: {
            applicationType: "Agriculture Activities",
            groundWaterUtilizationFor: "Agriculture",
            agriculturalDetails: {
                waterRequirementKLD: 20.0
            }
        }
    },
    {
        name: "2. Exempt Case: Domestic Individual (<= 5 KLD)",
        data: {
            applicationType: "Individual Domestic Use",
            groundWaterUtilizationFor: "Drinking/Domestic",
            dailyWaterRequirement: 4.5
        }
    },
    {
        name: "3. NON-Exempt Case: Industry (Banned)",
        data: {
            applicationType: "Industrial Use",
            groundWaterUtilizationFor: "Industry",
            industryType: "Textile",
            dailyWaterRequirement: 10.0
        }
    },
    {
        name: "4. Exempt Case: MSME Small (< 10 KLD)",
        data: {
            applicationType: "Industrial Use",
            groundWaterUtilizationFor: "Industry",
            isMSME: "Yes",
            msmeType: "Small",
            dailyWaterRequirement: 8.0
        }
    },
    {
        name: "5. NON-Exempt Case: MSME (> 10 KLD)",
        data: {
            applicationType: "Industrial Use",
            groundWaterUtilizationFor: "Industry",
            isMSME: "Yes",
            msmeType: "Small",
            dailyWaterRequirement: 15.0
        }
    },
    {
        name: "6. NON-Exempt Case: Packaged Drinking Water (Even if MSME)",
        data: {
            applicationType: "Industrial Use",
            groundWaterUtilizationFor: "Industry",
            industryType: "Packaged Drinking Water",
            isMSME: "Yes",
            msmeType: "Micro",
            dailyWaterRequirement: 5.0
        }
    }
];

async function runTests() {
    console.log("===========================================");
    console.log("Testing Exemption Eligibility API");
    console.log("===========================================\n");

    for (const scenario of scenarios) {
        console.log(`Running: ${scenario.name}`);
        try {
            const response = await axios.post(BASE_URL, scenario.data);
            console.log("Status:", response.status);
            console.log("Response:", JSON.stringify(response.data, null, 2));

            // Simple verification logging
            if (response.data.success) {
                if (response.data.displayConfig) {
                    console.log(`✅ Result: ${response.data.displayConfig.title}`);
                    console.log(`   Message: ${response.data.displayConfig.message}`);
                }
            }
        } catch (error) {
            console.error("❌ Request Failed:");
            if (error.response) {
                console.error("Status:", error.response.status);
                console.error("Data:", JSON.stringify(error.response.data, null, 2));
            } else {
                console.error("Error:", error.message);
            }
        }
        console.log("\n-------------------------------------------\n");
    }
}

runTests();
