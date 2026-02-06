const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/noc/exemption';

async function testExemptionAPI() {
    console.log("🚀 Starting Exemption API Tests...\n");

    // 1. Create Valid Exemption Application (Agriculture + Fresh + <50)
    console.log("1️⃣  Testing Valid Application Creation...");
    const validData = {
        "applicationType": "Agriculture Activities",
        "applicationSubType": "Ground Water Requirement for Agriculture",
        "groundWaterRequirementFor": "Agricultural draft",
        "waterQualityType": "Fresh Water",
        "applicationForBoring": "New Project",
        "dateOfBoring": "2026-02-01",
        "groundWaterUsage": {
            "drinkingDomestic": true,
            "agricultureUse": true
        },
        "ownerDetails": {
            "ownerName": "Test Farmer",
            "ownerPhone": "9876543210",
            "ownerEmail": "farmer@test.com",
            "ownerAddress": "Village X",
            "state": "RAJASTHAN",
            "district": "JAIPUR",
            "pinCode": "302001"
        },
        "agriculturalDetails": {
            "state": "RAJASTHAN",
            "district": "JAIPUR",
            "assessmentUnitBlockTehsil": "AMBER (Status: OVER EXPLOITED)",
            "address": "Jaipur",
            "pinCode": "302017",
            "landHoldingAreaHectare": 5.0,
            "landDetailsKhasraNo": "101/2",
            "gramPanchayatName": "Test GP",
            "waterRequirementKLD": 20.0
        }
    };

    let appId = null;

    try {
        const res = await axios.post(BASE_URL, validData);
        console.log("✅ Success:", res.data);
        if (res.data.success && res.data.exemptionEligible) {
            console.log("   -> Correctly identified as Exempted.");
            appId = res.data.applicationId;
        } else {
            console.error("   -> FAILED: Should be exempted.");
        }
    } catch (error) {
        console.error("❌ Failed:", error.response ? error.response.data : error.message);
    }

    // 2. Test Validation Error (Wrong Type)
    console.log("\n2️⃣  Testing Invalid Application Type (Validation Error)...");
    const invalidData1 = { ...validData, applicationType: "Industrial Use" };
    try {
        await axios.post(BASE_URL, invalidData1);
        console.error("❌ FAILED: Should have returned validation error.");
    } catch (error) {
        if (error.response && error.response.status === 400 && error.response.data.errorCode === "VALIDATION_ERROR") {
            console.log("✅ Success: Validation Caught:", error.response.data);
        } else {
            console.error("❌ Unexpected Error:", error.response ? error.response.data : error.message);
        }
    }

    // 3. Test Not Eligible (Usage > 50 in Over Exploited)
    console.log("\n3️⃣  Testing Non-Exempt Logic (>50 KLD in Over Exploited)...");
    const nonExemptData = JSON.parse(JSON.stringify(validData));
    nonExemptData.agriculturalDetails.waterRequirementKLD = 60.0; // > 50

    try {
        // Based on logic, this might be a validation error or just not exempted?
        // Prompt validation says: IF > 50 ... -> Exemption NOT allowed.
        // My controller validation logic makes it a "VALIDATION_ERROR" if it fails the "Exceeds exemption limit" check?
        // Wait, prompt said: "IF assessmentUnitBlockTehsil contains "OVER EXPLOITED" AND waterRequirementKLD > 50 → Exemption NOT allowed"
        // But also showed a Validation Error example: "waterRequirementKLD": "Exceeds exemption limit in over exploited area"
        // So I implemented it as a Validation Error.
        await axios.post(BASE_URL, nonExemptData);
        console.error("❌ FAILED: Should have returned rejection/validation error.");
    } catch (error) {
        if (error.response && error.response.status === 400 && error.response.data.errors && error.response.data.errors.waterRequirementKLD) {
            console.log("✅ Success: Limit Check Caught:", error.response.data);
        } else {
            console.error("❌ Unexpected Error:", error.response ? error.response.data : error.message);
        }
    }

    // 4. Get Application
    if (appId) {
        console.log(`\n4️⃣  Testing Get Application (${appId})...`);
        try {
            const res = await axios.get(`${BASE_URL}/${appId}`);
            console.log("✅ Success:", res.data.success);
        } catch (error) {
            console.error("❌ Failed:", error.message);
        }

        // 5. Submit Application
        console.log(`\n5️⃣  Testing Submit Application...`);
        try {
            const res = await axios.post(`${BASE_URL}/${appId}/submit`);
            console.log("✅ Success:", res.data);
        } catch (error) {
            console.error("❌ Failed:", error.message);
        }
    }
}

testExemptionAPI();
