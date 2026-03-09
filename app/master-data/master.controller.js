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
                message: "States retrieved successfully"
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
                message: "Districts retrieved successfully"
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
                message: "Blocks retrieved successfully"
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
                message: "Assessment units retrieved successfully"
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
                message: "Tehsils retrieved successfully"
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
                message: "Block category retrieved successfully"
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
                message: "Industry types retrieved successfully"
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
                message: "Document requirements retrieved successfully"
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
                message: "Fee structure retrieved successfully"
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
                message: "ID proof types retrieved successfully"
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
                message: "User titles retrieved successfully"
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
                message: "Genders retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/master/rejection-reasons
     * Get common rejection reasons for officers
     */
    async getRejectionReasons(req, res, next) {
        try {
            const reasons = [
                { id: "R001", reason: "Incomplete application details." },
                { id: "R002", reason: "Required documents missing or invalid." },
                { id: "R003", reason: "Water requirement exceeds permissible limits." },
                { id: "R004", reason: "Proposed extraction in a critical/over-exploited block without adequate recharge." },
                { id: "R005", reason: "Failure to comply with previous NOC conditions." },
                { id: "R006", reason: "Discrepancy in submitted site inspection data." },
                { id: "R007", reason: "Non-payment of required environmental compensation/fees." },
                { id: "R008", reason: "Other (Please specify in remarks)" }
            ];

            res.status(200).json({
                success: true,
                data: reasons,
                message: "Rejection reasons retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MasterController();
