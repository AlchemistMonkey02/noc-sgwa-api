const Company = require("../company/company.model");

/**
 * Middleware to verify user has at least one verified company
 * Required before applying for NOC
 */
const requireVerifiedCompany = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Check if user has at least one company (disabled verification check)
        const verifiedCompany = await Company.findOne({
            userId,
            // verificationStatus: "VERIFIED",
            // status: "ACTIVE",
        });

        if (!verifiedCompany) {
            return res.status(403).json({
                success: false,
                error: {
                    code: "NO_VERIFIED_COMPANY",
                    message: "You must have at least one verified company to apply for NOC. Please register and verify a company first.",
                },
            });
        }

        // Attach company to request for later use
        req.userCompany = verifiedCompany;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Failed to verify company status",
            },
        });
    }
};

/**
 * Middleware to verify company exists and belongs to user
 */
const verifyCompanyOwnership = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const companyId = req.body.companyId;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "COMPANY_ID_REQUIRED",
                    message: "Company ID is required for NOC application",
                },
            });
        }

        // Verify company exists and belongs to user (disabled verification check)
        const company = await Company.findOne({
            _id: companyId,
            userId,
            // verificationStatus: "VERIFIED",
            // status: "ACTIVE",
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "COMPANY_NOT_FOUND",
                    message: "Company not found or not verified. Please ensure you own this company and it is verified.",
                },
            });
        }

        // Attach company to request
        req.company = company;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Failed to verify company ownership",
            },
        });
    }
};

module.exports = {
    requireVerifiedCompany,
    verifyCompanyOwnership,
};
