const sgwaService = require("./sgwa.service");

class SGWAController {
    async getApplications(req, res, next) {
        try {
            const result = await sgwaService.getApplications(req.user.id, req.query);

            res.status(200).json({
                success: true,
                data: result.applications,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

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

    async approveApplication(req, res, next) {
        try {
            const application = await sgwaService.approveApplication(
                req.params.id,
                req.user.id,
                req.body
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Application approved and forwarded to Enforcement Wing"
            });
        } catch (error) {
            next(error);
        }
    }

    async rejectApplication(req, res, next) {
        try {
            const application = await sgwaService.rejectApplication(
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

    async raiseQuery(req, res, next) {
        try {
            const result = await sgwaService.raiseQuery(
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

    async getDashboardStats(req, res, next) {
        try {
            const stats = await sgwaService.getDashboardStats(req.user.id);

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SGWAController();
