/**
 * Test Document Requirements API
 * Tests all application types with various input combinations
 */

const axios = require("axios");

const API_BASE = process.env.API_URL || "http://rgwcma-noc-api.geoplanetsolution.in";
const API_ENDPOINT = `${API_BASE}/api/tools/document-requirements`;

// ANSI color codes
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m"
};

/**
 * Test helper function
 */
async function testDocumentRequirements(testName, payload) {
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}▶ Testing: ${testName}${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.yellow}Payload:${colors.reset}`, JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post(API_ENDPOINT, payload);

        if (response.data.success) {
            console.log(`${colors.green}✓ Success${colors.reset}`);
            console.log(`${colors.yellow}Application Type:${colors.reset}`, response.data.data.applicationType);
            console.log(`${colors.yellow}Withdrawal:${colors.reset}`, response.data.data.withdrawalKLD, "KLD");
            console.log(`${colors.yellow}Category:${colors.reset}`, response.data.data.withdrawalCategory);
            console.log(`${colors.yellow}Total Documents:${colors.reset}`, response.data.data.totalDocuments);
            console.log(`\n${colors.yellow}Required Documents:${colors.reset}`);

            response.data.data.requiredDocuments.forEach((doc, index) => {
                console.log(`\n  ${colors.cyan}${index + 1}. ${doc.documentName}${colors.reset}`);
                console.log(`     Code: ${doc.documentCode}`);
                console.log(`     Condition: ${doc.condition}`);
                console.log(`     Description: ${doc.description}`);
            });

            return true;
        } else {
            console.log(`${colors.red}✗ Failed${colors.reset}`, response.data);
            return false;
        }
    } catch (error) {
        console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
        if (error.response) {
            console.log(`${colors.red}Response:${colors.reset}`, error.response.data);
        }
        return false;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log(`\n${colors.green}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║     Document Requirements API - Comprehensive Test Suite      ║${colors.reset}`);
    console.log(`${colors.green}╚════════════════════════════════════════════════════════════════╝${colors.reset}`);

    const tests = [
        // Fresh Industry Tests
        {
            name: "Fresh Industry - < 10 KLD (Safe area)",
            payload: {
                applicationType: "FRESH_INDUSTRY",
                withdrawalKLD: 8,
                areaType: "SAFE",
                rockType: "HARD",
                projectInWetlandZone: false
            }
        },
        {
            name: "Fresh Industry - 10-100 KLD (OCS area, Hard rock)",
            payload: {
                applicationType: "FRESH_INDUSTRY",
                withdrawalKLD: 85,
                areaType: "OCS",
                rockType: "HARD",
                projectInWetlandZone: false
            }
        },
        {
            name: "Fresh Industry - > 100 KLD (Safe area, Soft rock, Wetland)",
            payload: {
                applicationType: "FRESH_INDUSTRY",
                withdrawalKLD: 150,
                areaType: "SAFE",
                rockType: "SOFT",
                projectInWetlandZone: true
            }
        },
        {
            name: "Fresh Industry - > 500 KLD (Safe, Hard) - Requires GW Modelling",
            payload: {
                applicationType: "FRESH_INDUSTRY",
                withdrawalKLD: 600,
                areaType: "SAFE",
                rockType: "HARD",
                projectInWetlandZone: false
            }
        },

        // Fresh Infrastructure - Construction Tests
        {
            name: "Fresh Infrastructure (Construction) - < 10 KLD",
            payload: {
                applicationType: "FRESH_INFRASTRUCTURE_CONSTRUCTION",
                withdrawalKLD: 5,
                areaType: "SAFE",
                dewateringInvolved: false
            }
        },
        {
            name: "Fresh Infrastructure (Construction) - > 100 KLD (OCS, with dewatering)",
            payload: {
                applicationType: "FRESH_INFRASTRUCTURE_CONSTRUCTION",
                withdrawalKLD: 120,
                areaType: "OCS",
                dewateringInvolved: true
            }
        },

        // Fresh Infrastructure - Drinking/Domestic Tests
        {
            name: "Fresh Infrastructure (Drinking/Domestic) - ≥ 10 KLD (Critical area)",
            payload: {
                applicationType: "FRESH_INFRASTRUCTURE_DRINKING",
                withdrawalKLD: 15,
                areaType: "CRITICAL",
                projectInWetlandZone: false
            }
        },
        {
            name: "Fresh Infrastructure (Drinking/Domestic) - > 20 KLD (Requires STP)",
            payload: {
                applicationType: "FRESH_INFRASTRUCTURE_DRINKING",
                withdrawalKLD: 25,
                areaType: "SAFE",
                projectInWetlandZone: false
            }
        },

        // Fresh Mining Tests
        {
            name: "Fresh Mining - 120 KLD (with wetland)",
            payload: {
                applicationType: "FRESH_MINING",
                withdrawalKLD: 120,
                projectInWetlandZone: true
            }
        },

        // Renewal Industry Tests
        {
            name: "Renewal Industry - < 10 KLD",
            payload: {
                applicationType: "RENEWAL_INDUSTRY",
                withdrawalKLD: 8,
                areaType: "SAFE",
                rockType: "HARD"
            }
        },
        {
            name: "Renewal Industry - > 100 KLD (OCS, Hard rock)",
            payload: {
                applicationType: "RENEWAL_INDUSTRY",
                withdrawalKLD: 150,
                areaType: "OCS",
                rockType: "HARD"
            }
        },

        // Renewal Infrastructure Tests
        {
            name: "Renewal Infrastructure - ≥ 10 KLD (Safe area)",
            payload: {
                applicationType: "RENEWAL_INFRASTRUCTURE",
                withdrawalKLD: 50,
                areaType: "SAFE",
                rockType: "SOFT",
                projectInWetlandZone: false
            }
        },

        // Renewal Mining Tests
        {
            name: "Renewal Mining - 80 KLD",
            payload: {
                applicationType: "RENEWAL_MINING",
                withdrawalKLD: 80
            }
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const result = await testDocumentRequirements(test.name, test.payload);
        if (result) {
            passed++;
        } else {
            failed++;
        }
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log(`\n${colors.green}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║                        Test Summary                            ║${colors.reset}`);
    console.log(`${colors.green}╚════════════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log(`${colors.green}✓ Passed:${colors.reset} ${passed}`);
    console.log(`${colors.red}✗ Failed:${colors.reset} ${failed}`);
    console.log(`${colors.yellow}Total:${colors.reset} ${tests.length}`);
    console.log("");

    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
