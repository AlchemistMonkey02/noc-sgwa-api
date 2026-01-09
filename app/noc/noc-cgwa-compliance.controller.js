const nocService = require("./noc.service");
const { checkCGWACompliance } = require("./cgwa-validator");

class NOCController {
    /**
     * GET /api/applications/noc/:id/cgwa-compliance
     * Check CGWA compliance for an application
     */
    async checkCGWACompliance(req, res, next) {
        try {
            const application = await nocService.getApplicationById(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            const complianceReport = checkCGWACompliance(application);

            res.status(200).json({
                success: true,
                data: {
                    applicationId: application.applicationId,
                    applicationNumber: application.applicationNumber,
                    compliance: complianceReport,
                },
                message: complianceReport.isCompliant
                    ? "Application is CGWA compliant"
                    : `Application has ${complianceReport.summary.critical} critical compliance issues`,
            });
        } catch (error) {
            next(error);
        }
    }

    // ... existing controller methods remain unchanged ...
}

module.exports = new NOCController();
