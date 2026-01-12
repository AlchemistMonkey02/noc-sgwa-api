const BlockClassification = require("./rules/block-classification.rule");
const ExemptionRules = require("./rules/exemption.rule");

class EligibilityController {
    /**
     * Get Eligibility Metadata (Districts, etc.)
     */
    getMetadata(req, res, next) {
        try {
            const districts = BlockClassification.getDistricts();
            // We can return more here if needed
            res.status(200).json({
                success: true,
                data: {
                    districts
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Blocks for a District
     */
    getBlocks(req, res, next) {
        try {
            const { districtId } = req.query;
            const blocks = BlockClassification.getBlocksForDistrict(null, districtId);
            res.status(200).json({
                success: true,
                data: {
                    blocks
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Check NOC Eligibility
     */
    async checkEligibility(req, res, next) {
        try {
            const {
                stateId,
                districtId,
                blockId,
                SectorType, // "Industry", "Agriculture", "Mining"
                projectType, // "New Project"
                waterRequirement = 0,
                industryType,
                isMSME,
                msmeClass, // "Micro", "Small", "Medium"
                isWetland
            } = req.body;

            // 1. Check Wetland Status (Strict Prohibition)
            if (isWetland) {
                return res.status(200).json({
                    success: true,
                    data: {
                        status: "NOT_ELIGIBLE",
                        title: "Not Eligible",
                        message: "Projects located in Notified Wetland Areas are strictly prohibited from groundwater extraction.",
                        details: [],
                        blockInfo: null
                    }
                });
            }

            // 2. Get Block Info
            const blockCategory = BlockClassification.getBlockCategory(districtId, blockId);
            const blockInfo = blockCategory ? {
                category: blockCategory.name,
                description: blockCategory.description,
                color: blockCategory.color
            } : null;

            // 3. Check Exemptions
            // Standardize formData for the rule engine
            const rulePayload = {
                SectorType,
                industryType,
                applicationType: projectType, // Heuristic mapping
                waterRequirement,
                isMSME,
                msmeClass,
                groundWaterUtilizationFor: SectorType // Mapping for legacy rule support
            };

            const exemptionResult = ExemptionRules.checkExemption(rulePayload);

            if (exemptionResult.isExempt) {
                return res.status(200).json({
                    success: true,
                    data: {
                        status: "EXEMPTED",
                        title: "Exempted from NOC",
                        message: exemptionResult.message,
                        details: [
                            `Exemption Category: ${exemptionResult.exemptionType}`,
                            "You are not required to obtain an NOC."
                        ],
                        blockInfo
                    }
                });
            }

            // 4. Check Block Eligibility/Restrictions
            const eligibilityCheck = BlockClassification.checkBlockEligibility(districtId, blockId, {
                industryType
            });

            if (!eligibilityCheck.allowed) {
                return res.status(200).json({
                    success: true,
                    data: {
                        status: "NOT_ELIGIBLE",
                        title: "Not Eligible",
                        message: eligibilityCheck.reason,
                        details: [],
                        blockInfo
                    }
                });
            }

            // 5. Eligible (NOC Required)
            return res.status(200).json({
                success: true,
                data: {
                    status: "ELIGIBLE",
                    title: "NOC Required",
                    message: "You are eligible to apply for NOC.",
                    details: [
                        `Block Category: ${blockInfo ? blockInfo.category : 'Unknown'}`,
                        `Validity: ${eligibilityCheck.validityYears} Years`
                    ],
                    blockInfo
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new EligibilityController();
