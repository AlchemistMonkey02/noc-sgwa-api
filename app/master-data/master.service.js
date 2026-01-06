const State = require("./state.model");
const District = require("./district.model");
const Block = require("./block.model");
const IndustryType = require("./industry-type.model");
const DocumentRequirement = require("./document-requirement.model");
const FeeStructure = require("./fee-structure.model");
const logger = require("../utils/logger");

class MasterService {
    /**
     * Get all states
     */
    async getStates() {
        try {
            const states = await State.find({ isActive: true }).select(
                "stateId stateName stateCode"
            ).sort({ stateName: 1 });

            return states;
        } catch (error) {
            logger.error("Error fetching states", error);
            throw error;
        }
    }

    /**
     * Get districts by state
     */
    async getDistricts(stateId) {
        try {
            const query = { isActive: true };
            if (stateId) {
                query.stateId = stateId.toUpperCase();
            }

            const districts = await District.find(query)
                .select("districtId districtName districtCode stateId latitude longitude")
                .sort({ districtName: 1 });

            return districts;
        } catch (error) {
            logger.error("Error fetching districts", error);
            throw error;
        }
    }

    /**
     * Get blocks by district
     */
    async getBlocks(districtId) {
        try {
            const query = { isActive: true };
            if (districtId) {
                query.districtId = districtId.toUpperCase();
            }

            const blocks = await Block.find(query)
                .select("blockId blockName blockCode districtId category")
                .sort({ blockName: 1 });

            return blocks;
        } catch (error) {
            logger.error("Error fetching blocks", error);
            throw error;
        }
    }

    /**
     * Get block category details
     */
    async getBlockCategory(districtId, blockId) {
        try {
            const block = await Block.findOne({
                districtId: districtId.toUpperCase(),
                blockId: blockId.toUpperCase(),
                isActive: true,
            });

            if (!block) {
                throw {
                    statusCode: 404,
                    code: "BLOCK_NOT_FOUND",
                    message: "Block not found",
                };
            }

            return {
                blockId: block.blockId,
                blockName: block.blockName,
                districtId: block.districtId,
                category: block.category,
                requiresNOC: block.requiresNOC,
                categoryCriteria: block.categoryCriteria,
                description: block.description,
            };
        } catch (error) {
            logger.error("Error fetching block category", error);
            throw error;
        }
    }

    /**
     * Get all industry types
     */
    async getIndustryTypes(category) {
        try {
            const query = { isActive: true };
            if (category) {
                query.category = category.toUpperCase();
            }

            const industryTypes = await IndustryType.find(query)
                .select("industryTypeId industryName category description requiredDocuments waterRequirement")
                .sort({ industryName: 1 });

            return industryTypes;
        } catch (error) {
            logger.error("Error fetching industry types", error);
            throw error;
        }
    }

    /**
     * Get document requirements
     */
    async getDocumentRequirements(applicationType) {
        try {
            const query = { isActive: true };
            if (applicationType) {
                query.$or = [
                    { applicationType: applicationType.toUpperCase() },
                    { applicationType: "ALL" },
                ];
            }

            const documents = await DocumentRequirement.find(query)
                .select(
                    "documentId documentName documentType isMandatory description maxFileSize allowedFormats sampleUrl"
                )
                .sort({ isMandatory: -1, documentName: 1 });

            return documents;
        } catch (error) {
            logger.error("Error fetching document requirements", error);
            throw error;
        }
    }

    /**
     * Get fee structure
     */
    async getFeeStructure(applicationType, blockCategory, waterRequirementMLD) {
        try {
            const query = {
                isActive: true,
                effectiveFrom: { $lte: new Date() },
                $or: [{ effectiveTo: { $gte: new Date() } }, { effectiveTo: null }],
            };

            if (applicationType) {
                query.applicationType = applicationType.toUpperCase();
            }

            if (blockCategory) {
                query.$or = [
                    { blockCategory: blockCategory.toUpperCase() },
                    { blockCategory: "ALL" },
                ];
            }

            const feeStructure = await FeeStructure.findOne(query).sort({
                effectiveFrom: -1,
            });

            if (!feeStructure) {
                throw {
                    statusCode: 404,
                    code: "FEE_STRUCTURE_NOT_FOUND",
                    message: "Fee structure not found for given criteria",
                };
            }

            // Calculate total fee if water requirement provided
            let totalFee = feeStructure.totalBaseFee;
            let ecCharges = 0;

            if (waterRequirementMLD && waterRequirementMLD > 0) {
                ecCharges = feeStructure.ecChargesPerMLD * waterRequirementMLD;
                totalFee = feeStructure.calculateTotalFee(waterRequirementMLD);
            }

            return {
                feeId: feeStructure.feeId,
                applicationType: feeStructure.applicationType,
                blockCategory: feeStructure.blockCategory,
                baseAmount: feeStructure.baseAmount,
                ecChargesPerMLD: feeStructure.ecChargesPerMLD,
                ecCharges: ecCharges,
                waterBudgetCharges: feeStructure.waterBudgetCharges,
                processingFee: feeStructure.processingFee,
                inspectionFee: feeStructure.inspectionFee,
                totalBaseFee: feeStructure.totalBaseFee,
                totalEstimated: totalFee,
                validityPeriod: feeStructure.validityPeriod,
                description: feeStructure.description,
                effectiveFrom: feeStructure.effectiveFrom,
                effectiveTo: feeStructure.effectiveTo,
            };
        } catch (error) {
            logger.error("Error fetching fee structure", error);
            throw error;
        }
    }
}

module.exports = new MasterService();
