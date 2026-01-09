const dgoService = require("./dgo.service");

class DGOController {
    /**
     * GET /api/officers/dgo/applications
     * Get applications for DGO review
     */
    async getApplications(req, res, next) {
        try {
            const result = await dgoService.getApplications(req.user.id, req.query);

            res.status(200).json({
                success: true,
                data: result.applications,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/officers/dgo/applications/:id
     * Get application details
     */
    async getApplicationById(req, res, next) {
        try {
            const NOCApplication = require("../../noc/noc-application.model");
            const application = await NOCApplication.findOne({ applicationId: req.params.id })
                .populate("userId", "firstName lastName email phone")
                .populate("companyId", "companyName contactPerson");

            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: "Application not found"
                });
            }

            res.status(200).json({
                success: true,
                data: application
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/officers/dgo/applications/:id/approve
     * Approve application and forward to SGWA
     */
    async approveApplication(req, res, next) {
        try {
            const application = await dgoService.approveApplication(
                req.params.id,
                req.user.id,
                req.body
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Application approved and forwarded to SGWA"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/officers/dgo/applications/:id/reject
     * Reject application
     */
    async rejectApplication(req, res, next) {
        try {
            const application = await dgoService.rejectApplication(
                req.params.id,
                req.user.id,
                req.body
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Application rejected"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/officers/dgo/applications/:id/query
     * Raise query to applicant
     */
    async raiseQuery(req, res, next) {
        try {
            const result = await dgoService.raiseQuery(
                req.params.id,
                req.user.id,
                req.body
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Query raised successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/officers/dgo/stats
     * Get DGO dashboard statistics
     */
    async getDashboardStats(req, res, next) {
        try {
            const stats = await dgoService.getDashboardStats(
                req.user.id,
                req.query.districtId
            );

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DGOController();
