const Document = require("../documents/document.model");

/**
 * Get required document types based on NOC application parameters
 */
const getRequiredDocuments = (application) => {
    const required = new Set();

    // 1. ALWAYS REQUIRED (All Applications)
    required.add("AADHAR");
    required.add("PAN");
    required.add("LAND_OWNERSHIP");
    required.add("SITE_PLAN");
    required.add("UNDERTAKING");
    required.add("WATER_QUALITY_REPORT");

    // 2. Based on Application Type
    if (application.applicationType === "RENEWAL" || application.applicationType === "AMENDMENT") {
        required.add("EXISTING_NOC");
        required.add("WATER_AUDIT_REPORT"); // Compliance report
    }

    // 3. Based on Water Extraction
    const extraction = application.waterRequirement?.proposedExtraction?.totalDailyExtraction || 0;

    if (extraction > 10) {
        required.add("CONSERVATION_PLAN");
        required.add("RAINWATER_HARVESTING_PLAN"); // MANDATORY for > 10 KLD
    }

    if (extraction > 100) {
        required.add("WATER_AUDIT_REPORT"); // For monitoring
    }

    // 4. Based on Borewell Depth
    const borewellDetails = application.waterRequirement?.proposedExtraction?.borewellDetails || [];
    const maxDepth = borewellDetails.reduce((max, bw) => Math.max(max, bw.depth || 0), 0);

    if (maxDepth > 100) {
        required.add("PUMPING_TEST_REPORT");
        required.add("HYDROGEOLOGICAL_REPORT");
    }

    const maxDischarge = borewellDetails.reduce((max, bw) => Math.max(max, bw.dischargeCapacity || 0), 0);
    if (maxDischarge > 50) {
        required.add("PUMPING_TEST_REPORT");
    }

    // 5. Based on Land Area
    const landArea = application.projectDetails?.landArea || 0;

    if (landArea > 1000 || extraction > 50) {
        required.add("GREEN_BELT_PLAN");
    }

    // 6. Based on Sector Type
    if (application.sectorType === "INDUSTRIAL") {
        required.add("FACTORY_LICENSE");
        required.add("RECYCLING_PLAN");
    }

    if (application.sectorType === "COMMERCIAL") {
        required.add("TRADE_LICENSE");
    }

    // 7. MSME Certificate
    if (application.projectDetails?.isMSME) {
        required.add("MSME_CERTIFICATE");
    }

    // 8. Clearances (if indicated in application)
    if (application.clearances?.environmentalClearance?.obtained) {
        required.add("EC_CERTIFICATE");
    }

    if (application.clearances?.consentToEstablish?.obtained) {
        required.add("CTO_CTE");
    }

    // 9. Company Documents
    required.add("GST_CERTIFICATE");

    return Array.from(required);
};

/**
 * Validate if all required documents are uploaded
 */
const validateDocumentCompleteness = async (application, userId, companyId) => {
    try {
        const requiredDocs = getRequiredDocuments(application);
        const missingDocs = [];

        // Get all documents uploaded by this user for this company
        const uploadedDocs = await Document.find({
            userId,
            companyId,
        }).select("documentType documentId");

        const uploadedTypes = new Set(uploadedDocs.map(doc => doc.documentType));

        // Check which required documents are missing
        for (const docType of requiredDocs) {
            if (!uploadedTypes.has(docType)) {
                missingDocs.push(docType);
            }
        }

        return {
            isComplete: missingDocs.length === 0,
            requiredDocuments: requiredDocs,
            uploadedDocuments: Array.from(uploadedTypes),
            missingDocuments: missingDocs,
            totalRequired: requiredDocs.length,
            totalUploaded: uploadedTypes.size,
            completionPercentage: Math.round((uploadedTypes.size / requiredDocs.length) * 100),
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get human-readable document names
 */
const getDocumentName = (docType) => {
    const names = {
        AADHAR: "Aadhaar Card",
        PAN: "PAN Card",
        LAND_OWNERSHIP: "Land Ownership Proof",
        SITE_PLAN: "Site Plan with Borewell Locations",
        UNDERTAKING: "Undertaking (CGWA Format)",
        WATER_QUALITY_REPORT: "Water Quality Analysis Report",
        EXISTING_NOC: "Existing NOC Copy",
        WATER_AUDIT_REPORT: "Water Audit/Compliance Report",
        CONSERVATION_PLAN: "Water Conservation Plan",
        RAINWATER_HARVESTING_PLAN: "Rainwater Harvesting Plan",
        PUMPING_TEST_REPORT: "Pumping Test Report",
        HYDROGEOLOGICAL_REPORT: "Hydrogeological Study Report",
        GREEN_BELT_PLAN: "Green Belt Development Plan",
        FACTORY_LICENSE: "Factory License",
        RECYCLING_PLAN: "Water Recycling & Reuse Plan",
        TRADE_LICENSE: "Trade License",
        MSME_CERTIFICATE: "MSME Registration Certificate",
        EC_CERTIFICATE: "Environmental Clearance Certificate",
        CTO_CTE: "Consent to Establish/Operate",
        GST_CERTIFICATE: "GST Registration Certificate",
    };
    return names[docType] || docType;
};

module.exports = {
    getRequiredDocuments,
    validateDocumentCompleteness,
    getDocumentName,
};
