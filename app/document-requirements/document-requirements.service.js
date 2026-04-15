/**
 * Document Requirements Service
 * Determines required documents based on application type and parameters
 */

class DocumentRequirementsService {
    /**
     * Map user-friendly inputs to internal application type
     * @param {string} applicationType - INDUSTRY, MINING, INFRASTRUCTURE
     * @param {string} utilizationFor - NEW, EXISTING
     * @param {string} purpose - CONSTRUCTION, DRINKING_DOMESTIC (for Infrastructure only)
     * @returns {string} Internal application type code
     */
    mapToInternalApplicationType(applicationType, utilizationFor, purpose = null) {
        const prefix = utilizationFor === "NEW" ? "FRESH" : "RENEWAL";

        if (applicationType === "INDUSTRY") {
            return `${prefix}_INDUSTRY`;
        } else if (applicationType === "MINING") {
            return `${prefix}_MINING`;
        } else if (applicationType === "INFRASTRUCTURE" || applicationType === "BULK WATER SUPPLY") {
            if (utilizationFor === "NEW") {
                // Fresh Infrastructure needs purpose
                if (purpose === "CONSTRUCTION") {
                    return "FRESH_INFRASTRUCTURE_CONSTRUCTION";
                } else if (purpose === "DRINKING_DOMESTIC") {
                    return "FRESH_INFRASTRUCTURE_DRINKING";
                } else {
                    throw new Error("For Infrastructure (NEW), purpose must be CONSTRUCTION or DRINKING_DOMESTIC");
                }
            } else {
                // Renewal Infrastructure is generic
                return "RENEWAL_INFRASTRUCTURE";
            }
        }

        throw new Error(`Invalid applicationType: ${applicationType}`);
    }

    /**
     * Get withdrawal category based on KLD
     * @param {number} kld - Withdrawal in KLD
     * @returns {string} Category: LESS_THAN_10, BETWEEN_10_AND_100, MORE_THAN_100
     */
    getWithdrawalCategory(kld) {
        if (kld === undefined || kld === null) return "ALL";
        if (kld < 10) return "LESS_THAN_10";
        if (kld <= 100) return "BETWEEN_10_AND_100";
        return "MORE_THAN_100";
    }

    /**
     * Fresh Industry Documents
     */
    getFreshIndustryDocuments(params) {
        const { withdrawalKLD, areaType, rockType, projectInWetlandZone } = params;
        const category = this.getWithdrawalCategory(withdrawalKLD);
        const documents = [];

        // Consent to Establish / Environmental Clearance → All
        documents.push({
            documentCode: "CONSENT_TO_ESTABLISH",
            documentName: "Consent to Establish / Environmental Clearance",
            description: "Environmental clearance from relevant authority",
            required: true,
            condition: "All applications"
        });

        // Affidavit (Public Water <10 KLD) → <10
        if (category === "ALL" || category === "LESS_THAN_10") {
            documents.push({
                documentCode: "AFFIDAVIT_PUBLIC_WATER",
                documentName: "Affidavit (Public Water <10 KLD)",
                description: "Affidavit confirming use of public water supply when available",
                required: true,
                condition: "Withdrawal < 10 KLD"
            });
        }

        // Certificate of Non/Partial Availability (Govt Agency) → ≥10
        if (category === "ALL" || category !== "LESS_THAN_10") {
            documents.push({
                documentCode: "CERTIFICATE_NON_AVAILABILITY",
                documentName: "Certificate of Non/Partial Availability (Government Agency)",
                description: "Certificate from government agency regarding water availability",
                required: true,
                condition: "Withdrawal ≥ 10 KLD"
            });
        }

        // Ground Water Quality Report → All
        documents.push({
            documentCode: "GW_QUALITY_REPORT",
            documentName: "Ground Water Quality Report",
            description: "Water quality analysis report from NABL/Government lab",
            required: true,
            condition: "All applications"
        });

        // Impact Assessment Report → >100
        if (category === "ALL" || category === "MORE_THAN_100") {
            documents.push({
                documentCode: "IMPACT_ASSESSMENT_REPORT",
                documentName: "Impact Assessment Report",
                description: "Environmental and hydrogeological impact assessment",
                required: true,
                condition: "Withdrawal > 100 KLD"
            });
        }

        // Impact Assessment + GW Modelling (OCS / Safe – threshold based) → >100
        if (category === "ALL" || category === "MORE_THAN_100") {
            const isOCS = areaType === "OCS";
            const hardThreshold = isOCS ? 500 : 500;
            const softThreshold = isOCS ? 1000 : 2000;
            const threshold = rockType === "HARD" ? hardThreshold : softThreshold;

            if (category === "ALL" || withdrawalKLD > threshold) {
                documents.push({
                    documentCode: "IMPACT_ASSESSMENT_GW_MODELLING",
                    documentName: "Impact Assessment + Ground Water Modelling",
                    description: "Advanced hydrogeological study with groundwater modeling",
                    required: true,
                    condition: `${areaType || 'Specific'} area, ${rockType || 'Specific'} rock, withdrawal > threshold`
                });
            }
        }

        // MSME Certificate → ≥10
        if (category === "ALL" || category !== "LESS_THAN_10") {
            documents.push({
                documentCode: "MSME_CERTIFICATE",
                documentName: "MSME Certificate",
                description: "Micro, Small, and Medium Enterprise registration certificate",
                required: true,
                condition: "Withdrawal ≥ 10 KLD"
            });
        }

        // Affidavit for Drinking/Domestic/Green Belt → <10
        if (category === "ALL" || category === "LESS_THAN_10") {
            documents.push({
                documentCode: "AFFIDAVIT_DRINKING_DOMESTIC",
                documentName: "Affidavit for Drinking/Domestic/Green Belt",
                description: "Affidavit for intended use of groundwater",
                required: true,
                condition: "Withdrawal < 10 KLD"
            });
        }

        // Source Water Availability Certificate → ≥10
        if (category === "ALL" || category !== "LESS_THAN_10") {
            documents.push({
                documentCode: "SOURCE_WATER_AVAILABILITY",
                documentName: "Source Water Availability Certificate",
                description: "Certificate confirming water source availability",
                required: true,
                condition: "Withdrawal ≥ 10 KLD"
            });
        }

        // Approval from Wetland Authority → If Wetland
        if (category === "ALL" || projectInWetlandZone) {
            documents.push({
                documentCode: "WETLAND_AUTHORITY_APPROVAL",
                documentName: "Approval from Wetland Authority",
                description: "Approval from designated wetland conservation authority",
                required: true,
                condition: "Project in wetland zone"
            });
        }

        // Signed Application → All
        documents.push({
            documentCode: "SIGNED_APPLICATION",
            documentName: "Signed Application Form",
            description: "Duly filled and signed application form",
            required: true,
            condition: "All applications"
        });

        return documents;
    }

    /**
     * Fresh Infrastructure - Construction Purpose
     */
    getFreshInfrastructureConstructionDocuments(params) {
        const { withdrawalKLD, areaType, dewateringInvolved } = params;
        const category = this.getWithdrawalCategory(withdrawalKLD);
        const documents = [];

        // Affidavit (Public Water <10 KLD) → <10
        if (category === "ALL" || category === "LESS_THAN_10") {
            documents.push({
                documentCode: "AFFIDAVIT_PUBLIC_WATER",
                documentName: "Affidavit (Public Water <10 KLD)",
                description: "Affidavit confirming use of public water supply when available",
                required: true,
                condition: "Withdrawal < 10 KLD"
            });
        }

        // Certificate of Non/Partial Availability of Treated Sewage Water
        // → ≥10 AND (CRITICAL / OCS)
        if (category === "ALL" || (category !== "LESS_THAN_10" && (areaType === "CRITICAL" || areaType === "OCS"))) {
            documents.push({
                documentCode: "CERTIFICATE_SEWAGE_WATER",
                documentName: "Certificate of Non/Partial Availability of Treated Sewage Water",
                description: "Certificate regarding availability of treated sewage water",
                required: true,
                condition: "Withdrawal ≥ 10 KLD and (Critical or OCS area)"
            });
        }

        // Impact Assessment (if Dewatering involved) → >100
        if (category === "ALL" || (category === "MORE_THAN_100" && dewateringInvolved)) {
            documents.push({
                documentCode: "IMPACT_ASSESSMENT_DEWATERING",
                documentName: "Impact Assessment (Dewatering)",
                description: "Impact assessment for dewatering activities",
                required: true,
                condition: "Withdrawal > 100 KLD with dewatering"
            });
        }

        // GW Quality Report (Existing Well) → All
        documents.push({
            documentCode: "GW_QUALITY_REPORT_EXISTING",
            documentName: "Ground Water Quality Report (Existing Well)",
            description: "Water quality report from existing well",
            required: true,
            condition: "All applications"
        });

        // Ground Water Requirement Details → All
        documents.push({
            documentCode: "GW_REQUIREMENT_DETAILS",
            documentName: "Ground Water Requirement Details",
            description: "Detailed calculation of groundwater requirement",
            required: true,
            condition: "All applications"
        });

        // General Affidavit → All
        documents.push({
            documentCode: "GENERAL_AFFIDAVIT",
            documentName: "General Affidavit",
            description: "General affidavit as per prescribed format",
            required: true,
            condition: "All applications"
        });

        // Signed Application → All
        documents.push({
            documentCode: "SIGNED_APPLICATION",
            documentName: "Signed Application Form",
            description: "Duly filled and signed application form",
            required: true,
            condition: "All applications"
        });

        return documents;
    }

    /**
     * Fresh Infrastructure - Drinking / Domestic Purpose
     */
    getFreshInfrastructureDrinkingDocuments(params) {
        const { withdrawalKLD, areaType, projectInWetlandZone } = params;
        const category = this.getWithdrawalCategory(withdrawalKLD);
        const documents = [];

        // Affidavit (Other Sources – Safe/Semi-Critical) → <10
        if (category === "ALL" || category === "LESS_THAN_10") {
            documents.push({
                documentCode: "AFFIDAVIT_OTHER_SOURCES",
                documentName: "Affidavit (Other Sources – Safe/Semi-Critical)",
                description: "Affidavit for use of other water sources",
                required: true,
                condition: "Withdrawal < 10 KLD"
            });
        }

        // Certificate of Non/Partial Availability (Govt Agency) → ≥10
        if (category === "ALL" || category !== "LESS_THAN_10") {
            documents.push({
                documentCode: "CERTIFICATE_NON_AVAILABILITY_GOVT",
                documentName: "Certificate of Non/Partial Availability (Government Agency)",
                description: "Certificate from government agency",
                required: true,
                condition: "Withdrawal ≥ 10 KLD"
            });
        }

        // GW Quality Report (NABL/Govt Lab) → ≥10
        if (category === "ALL" || category !== "LESS_THAN_10") {
            documents.push({
                documentCode: "GW_QUALITY_NABL",
                documentName: "Ground Water Quality Report (NABL/Govt Lab)",
                description: "Water quality report from NABL or Government laboratory",
                required: true,
                condition: "Withdrawal ≥ 10 KLD"
            });
        }

        // Water Requirement Calculation (NBC 2016) → ≥10
        if (category === "ALL" || category !== "LESS_THAN_10") {
            documents.push({
                documentCode: "WATER_REQUIREMENT_NBC",
                documentName: "Water Requirement Calculation (NBC 2016)",
                description: "Water requirement as per National Building Code 2016",
                required: true,
                condition: "Withdrawal ≥ 10 KLD"
            });
        }

        // Completion Certificate → ≥10
        if (category === "ALL" || category !== "LESS_THAN_10") {
            documents.push({
                documentCode: "COMPLETION_CERTIFICATE",
                documentName: "Completion Certificate",
                description: "Building completion certificate",
                required: true,
                condition: "Withdrawal ≥ 10 KLD"
            });
        }

        // STP Installation → If KLD > 20
        if (category === "ALL" || withdrawalKLD > 20) {
            documents.push({
                documentCode: "STP_INSTALLATION",
                documentName: "STP Installation Certificate",
                description: "Sewage Treatment Plant installation certificate",
                required: true,
                condition: "Withdrawal > 20 KLD"
            });
        }

        // Wetland Authority Approval → If Wetland
        if (category === "ALL" || projectInWetlandZone) {
            documents.push({
                documentCode: "WETLAND_AUTHORITY_APPROVAL",
                documentName: "Wetland Authority Approval",
                description: "Approval from wetland conservation authority",
                required: true,
                condition: "Project in wetland zone"
            });
        }

        return documents;
    }

    /**
     * Fresh Mining Documents
     */
    getFreshMiningDocuments(params) {
        const { withdrawalKLD, projectInWetlandZone } = params;
        const category = this.getWithdrawalCategory(withdrawalKLD);
        const documents = [];

        // Approved Mine Plan → All
        documents.push({
            documentCode: "APPROVED_MINE_PLAN",
            documentName: "Approved Mine Plan",
            description: "Mining plan approved by competent authority",
            required: true,
            condition: "All mining applications"
        });

        // Comprehensive Hydrogeological Report + Impact Assessment → ≥10
        if (category === "ALL" || category !== "LESS_THAN_10") {
            documents.push({
                documentCode: "HYDROGEOLOGICAL_IMPACT_REPORT",
                documentName: "Comprehensive Hydrogeological Report + Impact Assessment",
                description: "Detailed hydrogeological study and environmental impact assessment",
                required: true,
                condition: "Withdrawal ≥ 10 KLD"
            });
        }

        // Wetland Authority Approval → If Wetland
        if (category === "ALL" || projectInWetlandZone) {
            documents.push({
                documentCode: "WETLAND_AUTHORITY_APPROVAL",
                documentName: "Wetland Authority Approval",
                description: "Approval from wetland conservation authority",
                required: true,
                condition: "Project in wetland zone"
            });
        }

        return documents;
    }

    /**
     * Renewal Industry Documents
     */
    getRenewalIndustryDocuments(params) {
        const { withdrawalKLD, areaType, rockType } = params;
        const category = this.getWithdrawalCategory(withdrawalKLD);
        const documents = [];

        // Affidavit on Compliance → <10
        if (category === "ALL" || category === "LESS_THAN_10") {
            documents.push({
                documentCode: "AFFIDAVIT_COMPLIANCE",
                documentName: "Affidavit on Compliance",
                description: "Affidavit confirming compliance with previous NOC conditions",
                required: true,
                condition: "Withdrawal < 10 KLD"
            });
        }

        // Self Compliance Report (NOCAP) → ≥10
        if (category === "ALL" || category !== "LESS_THAN_10") {
            documents.push({
                documentCode: "SELF_COMPLIANCE_NOCAP",
                documentName: "Self Compliance Report (NOCAP)",
                description: "Self compliance report through NOCAP system",
                required: true,
                condition: "Withdrawal ≥ 10 KLD"
            });
        }

        // Water Audit Report → >100
        if (category === "ALL" || category === "MORE_THAN_100") {
            documents.push({
                documentCode: "WATER_AUDIT_REPORT",
                documentName: "Water Audit Report",
                description: "Comprehensive water usage audit report",
                required: true,
                condition: "Withdrawal > 100 KLD"
            });
        }

        // Affidavit (Public Water <10 KLD) → <10
        if (category === "ALL" || category === "LESS_THAN_10") {
            documents.push({
                documentCode: "AFFIDAVIT_PUBLIC_WATER",
                documentName: "Affidavit (Public Water <10 KLD)",
                description: "Affidavit confirming use of public water supply",
                required: true,
                condition: "Withdrawal < 10 KLD"
            });
        }

        // Certificate of Non-Availability (Govt Agency) → ≥10
        if (category === "ALL" || category !== "LESS_THAN_10") {
            documents.push({
                documentCode: "CERTIFICATE_NON_AVAILABILITY",
                documentName: "Certificate of Non-Availability (Government Agency)",
                description: "Certificate from government agency",
                required: true,
                condition: "Withdrawal ≥ 10 KLD"
            });
        }

        // Impact Assessment (OCS) → >100 & OCS
        if (category === "ALL" || (category === "MORE_THAN_100" && areaType === "OCS")) {
            documents.push({
                documentCode: "IMPACT_ASSESSMENT_OCS",
                documentName: "Impact Assessment (OCS)",
                description: "Impact assessment for Over-Exploited/Critical/Semi-Critical area",
                required: true,
                condition: "Withdrawal > 100 KLD in OCS area"
            });
        }

        // Impact Assessment + GW Modelling
        if (category === "MORE_THAN_100") {
            const isOCS = areaType === "OCS";
            const hardThreshold = isOCS ? 500 : 500;
            const softThreshold = isOCS ? 1000 : 2000;
            const threshold = rockType === "HARD" ? hardThreshold : softThreshold;

            if (category === "ALL" || withdrawalKLD > threshold) {
                documents.push({
                    documentCode: "IMPACT_ASSESSMENT_GW_MODELLING",
                    documentName: "Impact Assessment + Ground Water Modelling",
                    description: "Advanced study with groundwater modeling",
                    required: true,
                    condition: `${areaType || 'Specific'} area, ${rockType || 'Specific'} rock, withdrawal > threshold`
                });
            }
        }

        return documents;
    }

    /**
     * Renewal Infrastructure Documents
     */
    getRenewalInfrastructureDocuments(params) {
        const { withdrawalKLD, areaType, rockType, projectInWetlandZone } = params;
        const category = this.getWithdrawalCategory(withdrawalKLD);
        const documents = [];

        // Affidavit on Compliance → <10
        if (category === "ALL" || category === "LESS_THAN_10") {
            documents.push({
                documentCode: "AFFIDAVIT_COMPLIANCE",
                documentName: "Affidavit on Compliance",
                description: "Affidavit confirming compliance with previous NOC",
                required: true,
                condition: "Withdrawal < 10 KLD"
            });
        }

        // Self Compliance Report → ≥10
        if (category === "ALL" || category !== "LESS_THAN_10") {
            documents.push({
                documentCode: "SELF_COMPLIANCE_REPORT",
                documentName: "Self Compliance Report",
                description: "Report on compliance with NOC conditions",
                required: true,
                condition: "Withdrawal ≥ 10 KLD"
            });
        }

        // Impact Assessment (OCS) → >100 & OCS
        if (category === "ALL" || (category === "MORE_THAN_100" && areaType === "OCS")) {
            documents.push({
                documentCode: "IMPACT_ASSESSMENT_OCS",
                documentName: "Impact Assessment (OCS)",
                description: "Impact assessment for OCS area",
                required: true,
                condition: "Withdrawal > 100 KLD in OCS area"
            });
        }

        // Impact Assessment + GW Modelling
        if (category === "ALL" || category === "MORE_THAN_100") {
            const isOCS = areaType === "OCS";
            const hardThreshold = isOCS ? 500 : 500;
            const softThreshold = isOCS ? 1000 : 2000;
            const threshold = rockType === "HARD" ? hardThreshold : softThreshold;

            if (category === "ALL" || withdrawalKLD > threshold) {
                documents.push({
                    documentCode: "IMPACT_ASSESSMENT_GW_MODELLING",
                    documentName: "Impact Assessment + Ground Water Modelling",
                    description: "Advanced hydrogeological modeling study",
                    required: true,
                    condition: `${areaType || 'Specific'} area, ${rockType || 'Specific'} rock, withdrawal > threshold`
                });
            }
        }

        // Affidavit (Public Water <10 KLD) → <10
        if (category === "ALL" || category === "LESS_THAN_10") {
            documents.push({
                documentCode: "AFFIDAVIT_PUBLIC_WATER",
                documentName: "Affidavit (Public Water <10 KLD)",
                description: "Affidavit for public water usage",
                required: true,
                condition: "Withdrawal < 10 KLD"
            });
        }

        // Certificate of Non-Availability (Govt Agency) → ≥10
        if (category === "ALL" || category !== "LESS_THAN_10") {
            documents.push({
                documentCode: "CERTIFICATE_NON_AVAILABILITY",
                documentName: "Certificate of Non-Availability (Government Agency)",
                description: "Certificate from government agency",
                required: true,
                condition: "Withdrawal ≥ 10 KLD"
            });
        }

        // Wetland Authority Approval → If Wetland
        if (category === "ALL" || projectInWetlandZone) {
            documents.push({
                documentCode: "WETLAND_AUTHORITY_APPROVAL",
                documentName: "Wetland Authority Approval",
                description: "Approval from wetland authority",
                required: true,
                condition: "Project in wetland zone"
            });
        }

        return documents;
    }

    /**
     * Renewal Mining Documents
     */
    getRenewalMiningDocuments(params) {
        const { withdrawalKLD } = params;
        const category = this.getWithdrawalCategory(withdrawalKLD);
        const documents = [];

        // Affidavit on Compliance → <10
        if (category === "ALL" || category === "LESS_THAN_10") {
            documents.push({
                documentCode: "AFFIDAVIT_COMPLIANCE",
                documentName: "Affidavit on Compliance",
                description: "Affidavit confirming compliance with NOC conditions",
                required: true,
                condition: "Withdrawal < 10 KLD"
            });
        }

        // Self Compliance Report → ≥10
        if (category === "ALL" || category !== "LESS_THAN_10") {
            documents.push({
                documentCode: "SELF_COMPLIANCE_REPORT",
                documentName: "Self Compliance Report",
                description: "Compliance report for previous NOC period",
                required: true,
                condition: "Withdrawal ≥ 10 KLD"
            });
        }

        // Comprehensive Hydrogeological Report (Core & Buffer) → All
        documents.push({
            documentCode: "HYDROGEOLOGICAL_CORE_BUFFER",
            documentName: "Comprehensive Hydrogeological Report (Core & Buffer)",
            description: "Hydrogeological assessment for core and buffer zones",
            required: true,
            condition: "All mining renewal applications"
        });

        // Water Quality Report (Mine Seepage & Wells) → All
        documents.push({
            documentCode: "WATER_QUALITY_MINE_WELLS",
            documentName: "Water Quality Report (Mine Seepage & Wells)",
            description: "Water quality analysis from mine seepage and nearby wells",
            required: true,
            condition: "All mining renewal applications"
        });

        return documents;
    }

    /**
     * Main dispatcher - Routes to appropriate function based on application type
     * Supports both old format (applicationType: "FRESH_INDUSTRY") and new format
     * (applicationType: "INDUSTRY", utilizationFor: "NEW")
     */
    getRequiredDocuments(payload) {
        let internalApplicationType;

        // Check if using new user-friendly format
        // Check if using new user-friendly format or generic types
        if (payload.utilizationFor || ["INDUSTRY", "MINING", "INFRASTRUCTURE"].includes(payload.applicationType)) {
            // New format: applicationType + utilizationFor + purpose
            // Default utilizationFor to "NEW" if not provided
            const utilization = payload.utilizationFor || "NEW";

            internalApplicationType = this.mapToInternalApplicationType(
                payload.applicationType,
                utilization,
                payload.purpose
            );
        } else {
            // Old format: applicationType already contains full type (e.g., "FRESH_INDUSTRY")
            internalApplicationType = payload.applicationType;
        }

        switch (internalApplicationType) {
            case "FRESH_INDUSTRY":
                return this.getFreshIndustryDocuments(payload);

            case "FRESH_INFRASTRUCTURE_CONSTRUCTION":
                return this.getFreshInfrastructureConstructionDocuments(payload);

            case "FRESH_INFRASTRUCTURE_DRINKING":
                return this.getFreshInfrastructureDrinkingDocuments(payload);

            case "FRESH_MINING":
                return this.getFreshMiningDocuments(payload);

            case "RENEWAL_INDUSTRY":
                return this.getRenewalIndustryDocuments(payload);

            case "RENEWAL_INFRASTRUCTURE":
                return this.getRenewalInfrastructureDocuments(payload);

            case "RENEWAL_MINING":
                return this.getRenewalMiningDocuments(payload);

            default:
                throw new Error(`Unknown internal application type: ${internalApplicationType}`);
        }
    }
}

module.exports = new DocumentRequirementsService();
