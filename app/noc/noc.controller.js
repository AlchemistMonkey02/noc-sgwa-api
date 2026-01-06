const nocService = require("./noc.service");

class NOCController {
    /**
     * POST /api/applications/noc
     * Create or update draft application
     */
    async createOrUpdateApplication(req, res, next) {
        try {
            const application = await nocService.createOrUpdateApplication(req.body, req.user.id);

            res.status(req.body.applicationId ? 200 : 201).json({
                success: true,
                data: application,
                message: req.body.applicationId
                    ? "Application updated successfully"
                    : "Application created successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc
     * Get user's applications
     */
    async getUserApplications(req, res, next) {
        try {
            const result = await nocService.getUserApplications(req.user.id, req.query);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id
     * Get application details
     */
    async getApplicationById(req, res, next) {
        try {
            const application = await nocService.getApplicationById(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: application,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id
     * Update application (alias for create/update)
     */
    async updateApplication(req, res, next) {
        try {
            req.body.applicationId = req.params.id;
            const application = await nocService.createOrUpdateApplication(req.body, req.user.id);

            res.status(200).json({
                success: true,
                data: application,
                message: "Application updated successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/submit
     * Submit application for review
     */
    async submitApplication(req, res, next) {
        try {
            const application = await nocService.submitApplication(req.params.id, req.user.id);

            res.status(200).json({
                success: true,
                data: {
                    applicationId: application.applicationId,
                    applicationNumber: application.applicationNumber,
                    status: application.status,
                    feeDetails: application.feeDetails,
                },
                message: "Application submitted successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/withdraw
     * Withdraw application
     */
    async withdrawApplication(req, res, next) {
        try {
            const application = await nocService.withdrawApplication(req.params.id, req.user.id);

            res.status(200).json({
                success: true,
                data: application,
                message: "Application withdrawn successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/queries
     * Get application queries
     */
    async getApplicationQueries(req, res, next) {
        try {
            const queries = await nocService.getApplicationQueries(req.params.id);

            res.status(200).json({
                success: true,
                count: queries.length,
                data: queries,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/queries/:queryId/respond
     * Respond to query
     */
    async respondToQuery(req, res, next) {
        try {
            const query = await nocService.respondToQuery(
                req.params.queryId,
                req.body.response,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: query,
                message: "Query responded successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/track/:applicationNumber (Public)
     * Track application status
     */
    async trackApplication(req, res, next) {
        try {
            const application = await nocService.trackApplication(req.params.applicationNumber);

            res.status(200).json({
                success: true,
                data: application,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/certificate
     * Download NOC certificate
     */
    async getCertificate(req, res, next) {
        try {
            const application = await nocService.getApplicationById(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            if (!application.nocCertificateId) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "CERTIFICATE_NOT_FOUND",
                        message: "NOC certificate not yet issued",
                    },
                });
            }

            // TODO: Generate and serve PDF
            res.status(200).json({
                success: true,
                data: application.nocCertificateId,
                message: "Certificate found (PDF generation pending)",
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NOCController();
