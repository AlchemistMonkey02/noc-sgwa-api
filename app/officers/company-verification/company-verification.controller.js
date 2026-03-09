const companyVerificationService = require("./company-verification.service");

class CompanyVerificationController {
    /**
     * GET /api/officers/company-verification/pending
     * Get companies pending verification
     */
    async getPendingCompanies(req, res, next) {
        try {
            const result = await companyVerificationService.getPendingCompanies(
                req.user.id,
                req.query
            );

            res.status(200).json({
                success: true,
                data: result.companies,
                pagination: result.pagination,
                message: "Pending companies retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/officers/company-verification/:companyId
     * Get company details for verification
     */
    async getCompanyDetails(req, res, next) {
        try {
            const company = await companyVerificationService.getCompanyDetails(req.params.companyId);

            res.status(200).json({
                success: true,
                data: company,
                message: "Company details retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/officers/company-verification/:companyId/verify
     * Verify and approve company
     */
    async verifyCompany(req, res, next) {
        try {
            const company = await companyVerificationService.verifyCompany(
                req.params.companyId,
                req.user.id,
                req.body
            );

            res.status(200).json({
                success: true,
                data: company,
                message: "Company verified successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/officers/company-verification/:companyId/reject
     * Reject company verification
     */
    async rejectCompany(req, res, next) {
        try {
            const company = await companyVerificationService.rejectCompany(
                req.params.companyId,
                req.user.id,
                req.body
            );

            res.status(200).json({
                success: true,
                data: company,
                message: "Company verification rejected"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/officers/company-verification/stats
     * Get verification statistics
     */
    async getStats(req, res, next) {
        try {
            const stats = await companyVerificationService.getVerificationStats();

            res.status(200).json({
                success: true,
                data: stats,
                message: "Verification statistics retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CompanyVerificationController();
