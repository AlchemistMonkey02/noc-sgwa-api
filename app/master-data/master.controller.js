const masterService = require("./master.service");
const logger = require("../utils/logger");

class MasterController {
    /**
     * GET /api/master/states
     * Get all states
     */
    async getStates(req, res, next) {
        try {
            const states = await masterService.getStates();

            res.status(200).json({
                success: true,
                count: states.length,
                data: states,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/master/districts?stateId=RAJ
     * Get districts by state
     */
    async getDistricts(req, res, next) {
        try {
            const { stateId } = req.query;
            const districts = await masterService.getDistricts(stateId);

            res.status(200).json({
                success: true,
                count: districts.length,
                data: districts,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/master/blocks?districtId=JAIPUR
     * Get blocks by district
     */
    async getBlocks(req, res, next) {
        try {
            const { districtId } = req.query;
            const blocks = await masterService.getBlocks(districtId);

            res.status(200).json({
                success: true,
                count: blocks.length,
                data: blocks,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/master/blocks/:districtId/:blockId/category
     * Get block category details
     */
    async getBlockCategory(req, res, next) {
        try {
            const { districtId, blockId } = req.params;
            const blockCategory = await masterService.getBlockCategory(districtId, blockId);

            res.status(200).json({
                success: true,
                data: blockCategory,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/master/industry-types?category=MANUFACTURING
     * Get industry types
     */
    async getIndustryTypes(req, res, next) {
        try {
            const { category } = req.query;
            const industryTypes = await masterService.getIndustryTypes(category);

            res.status(200).json({
                success: true,
                count: industryTypes.length,
                data: industryTypes,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/master/documents/requirements?applicationType=NEW_NOC
     * Get document requirements
     */
    async getDocumentRequirements(req, res, next) {
        try {
            const { applicationType } = req.query;
            const documents = await masterService.getDocumentRequirements(applicationType);

            res.status(200).json({
                success: true,
                count: documents.length,
                data: documents,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/master/fees?applicationType=NEW_NOC&blockCategory=SAFE&waterRequirement=10
     * Get fee structure
     */
    async getFeeStructure(req, res, next) {
        try {
            const { applicationType, blockCategory, waterRequirement } = req.query;
            const waterRequirementMLD = waterRequirement ? parseFloat(waterRequirement) : 0;

            const fees = await masterService.getFeeStructure(
                applicationType,
                blockCategory,
                waterRequirementMLD
            );

            res.status(200).json({
                success: true,
                data: fees,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MasterController();
