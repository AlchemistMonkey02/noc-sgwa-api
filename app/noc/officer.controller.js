const officerService = require("./officer.service");

class OfficerController {
    /**
     * GET /api/officer/applications
     * Get applications for review
     */
    async getApplications(req, res, next) {
        try {
            const result = await officerService.getAssignedApplications(req.user.id, req.query);

            res.status(200).json({
                success: true,
                ...result,
                message: "Applications retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/officer/applications/:id/assign
     * Assign application to self
     */
    async assignApplication(req, res, next) {
        try {
            const application = await officerService.assignApplication(
                req.params.id,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Application assigned successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/officer/applications/:id/query
     * Raise query on application
     */
    async raiseQuery(req, res, next) {
        try {
            const query = await officerService.raiseQuery(
                req.params.id,
                req.body.query,
                req.user.id
            );

            res.status(201).json({
                success: true,
                data: query,
                message: "Query raised successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/officer/applications/:id/approve
     * Approve application
     */
    async approveApplication(req, res, next) {
        try {
            const result = await officerService.approveApplication(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Application approved successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/officer/applications/:id/reject
     * Reject application
     */
    async rejectApplication(req, res, next) {
        try {
            const application = await officerService.rejectApplication(
                req.params.id,
                req.body.rejectionReason,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Application rejected",
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OfficerController();
