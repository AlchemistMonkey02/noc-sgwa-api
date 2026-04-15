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
                pagination: result.pagination,
                message: "Applications retrieved successfully"
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
            const application = await dgoService.getApplicationById(req.params.id);

            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: "Application not found"
                });
            }

            res.status(200).json({
                success: true,
                data: application,
                message: "Application details retrieved successfully"
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

    async scheduleInspection(req, res, next) {
        try {
            const result = await dgoService.scheduleInspection(
                req.params.id,
                req.user.id,
                req.body
            );
            res.json({ success: true, message: "Inspection scheduled", data: result });
        } catch (err) { next(err); }
    }

    async submitInspectionReport(req, res, next) {
        try {
            const result = await dgoService.submitInspectionReport(
                req.params.id,
                req.user.id,
                req.body
            );
            res.json({ success: true, message: "Inspection report submitted", data: result });
        } catch (err) { next(err); }
    }

    /**
     * GET /api/officers/dgo/inspections/:id/report
     * Get inspection report
     */
    async getInspectionReport(req, res, next) {
        try {
            const report = await dgoService.getInspectionReport(req.params.id);
            res.status(200).json({
                success: true,
                data: report,
                message: "Inspection report retrieved successfully"
            });
        } catch (err) { next(err); }
    }

    /**
     * POST /api/officers/dgo/applications/:id/verify-documents
     * Verify documents
     */
    async verifyDocuments(req, res, next) {
        try {
            const result = await dgoService.verifyDocuments(
                req.params.id,
                req.user.id,
                req.body
            );
            res.status(200).json({
                success: true,
                message: "Documents verified successfully",
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/officers/dgo/queries
     * Get all queries
     */
    async getQueries(req, res, next) {
        try {
            const result = await dgoService.getQueries(req.user.id, req.query);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/officers/dgo/queries/:id
     * Get query details
     */
    async getQueryById(req, res, next) {
        try {
            const result = await dgoService.getQueryById(req.params.id);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/officers/dgo/queries/:id/accept
     * Accept query response
     */
    async acceptQueryResponse(req, res, next) {
        try {
            const result = await dgoService.acceptQueryResponse(req.params.id, req.user.id);
            res.status(200).json({
                success: true,
                message: "Query response accepted",
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/officers/dgo/queries/:id/reject
     * Reject query response
     */
    async rejectQueryResponse(req, res, next) {
        try {
            const result = await dgoService.rejectQueryResponse(req.params.id, req.user.id, req.body);
            res.status(200).json({
                success: true,
                message: "Query response rejected",
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/officers/dgo/compliance-report
     * Get compliance report
     */
    async getComplianceReport(req, res, next) {
        try {
            const result = await dgoService.getComplianceReport(req.user.id, req.query);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/officers/dgo/reports/generate
     * Generate PDF report
     */
    async generateReport(req, res, next) {
        try {
            const result = await dgoService.generateReport(req.user.id, req.body);
            res.status(200).json({
                success: true,
                message: "Report generated successfully",
                data: result
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
                data: stats,
                message: "PROBE DGO: Dashboard statistics retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/officers/dgo/officers
     * Get officers by role
     */
    async getOfficers(req, res, next) {
        try {
            const officers = await dgoService.getOfficers(
                req.query.role || req.query.userType,
                req.user.id
            );
            res.status(200).json({
                success: true,
                data: officers,
                message: "Officers retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DGOController();
