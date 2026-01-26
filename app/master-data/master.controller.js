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
     * GET /api/master/assessment-units?districtId=JAIPUR
     * Get assessment units (aliased blocks)
     */
    async getAssessmentUnits(req, res, next) {
        try {
            const { districtId } = req.query;
            const units = await masterService.getAssessmentUnits(districtId);

            res.status(200).json({
                success: true,
                count: units.length,
                data: units,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/master/tehsils?districtId=JAIPUR
     * Get tehsils
     */
    async getTehsils(req, res, next) {
        try {
            const { districtId } = req.query;
            const tehsils = await masterService.getTehsils(districtId);

            res.status(200).json({
                success: true,
                count: tehsils.length,
                data: tehsils,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/master/blocks/:districtId/:blockId/category

    /**
     * GET /api/master/blocks/:districtId/:blockId/category
     * Get block category details
     */
    async getBlockCategory(req, res, next) {
        try {
            const { districtId, blockId } = req.body;
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
            console.log("🔍 getFeeStructure hit:", req.query);
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
    /**
     * GET /api/master/id-proof-types
     * Get valid ID proof types
     */
    async getIdProofTypes(req, res, next) {
        try {
            const idProofTypes = [
                { type: "AADHAAR", label: "Aadhaar Card", pattern: "^[0-9]{12}$", description: "12-digit number" },
                { type: "PAN", label: "PAN Card", pattern: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", description: "ABCDE1234F" },
                { type: "VOTER_ID", label: "Voter ID", pattern: "^[A-Z0-9]{10}$", description: "Alpha-numeric ID" },
                { type: "PASSPORT", label: "Passport", pattern: "^[A-Z][0-9]{7}$", description: "Letter followed by 7 digits" },
                { type: "DRIVING_LICENSE", label: "Driving License", pattern: "^[A-Z0-9]{15}$", description: "15-character alpha-numeric" },
            ];

            res.status(200).json({
                success: true,
                count: idProofTypes.length,
                data: idProofTypes,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/master/titles
     * Get user honorific titles
     */
    async getUserTitles(req, res, next) {
        try {
            const titles = ["Mr", "Mrs", "Ms", "Dr", "Prof"];

            res.status(200).json({
                success: true,
                count: titles.length,
                data: titles,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/master/genders
     * Get user genders
     */
    async getGenders(req, res, next) {
        try {
            const genders = ["MALE", "FEMALE", "OTHER"];

            res.status(200).json({
                success: true,
                count: genders.length,
                data: genders,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MasterController();
