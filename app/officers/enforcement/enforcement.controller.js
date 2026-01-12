const enforcementService = require("./enforcement.service");

class EnforcementController {
    async getApplications(req, res, next) {
        try {
            const result = await enforcementService.getApplications(req.user.id, req.query);

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

    async scheduleInspection(req, res, next) {
        try {
            const application = await enforcementService.scheduleInspection(
                req.params.id,
                req.user.id,
                req.body
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Inspection scheduled successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    async approveApplication(req, res, next) {
        try {
            const result = await enforcementService.approveApplication(
                req.params.id,
                req.user.id,
                req.body
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "NOC issued successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    async rejectApplication(req, res, next) {
        try {
            const application = await enforcementService.rejectApplication(
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
            const result = await enforcementService.raiseQuery(
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

    async getActiveNOCs(req, res, next) {
        try {
            const results = await enforcementService.getActiveNOCs(req.query);
            res.json({ success: true, data: results });
        } catch (err) { next(err); }
    }

    async scheduleComplianceInspection(req, res, next) {
        try {
            const result = await enforcementService.scheduleComplianceInspection(req.user.id, req.body);
            res.json({ success: true, message: "Inspection scheduled", data: result });
        } catch (err) { next(err); }
    }

    async submitComplianceReport(req, res, next) {
        try {
            const result = await enforcementService.submitComplianceReport(req.params.id, req.user.id, req.body);
            res.json({ success: true, message: "Compliance report submitted", data: result });
        } catch (err) { next(err); }
    }

    async issueWarning(req, res, next) {
        try {
            const result = await enforcementService.issueWarning(req.user.id, req.body);
            res.json({ success: true, message: "Warning issued", data: result });
        } catch (err) { next(err); }
    }

    async imposePenalty(req, res, next) {
        try {
            const result = await enforcementService.imposePenalty(req.user.id, req.body);
            res.json({ success: true, message: "Penalty imposed", data: result });
        } catch (err) { next(err); }
    }

    async initiateCancellation(req, res, next) {
        try {
            const result = await enforcementService.initiateCancellation(req.params.id, req.user.id, req.body);
            res.json({ success: true, message: "Cancellation initiated", data: result });
        } catch (err) { next(err); }
    }

    async registerComplaint(req, res, next) {
        try {
            const result = await enforcementService.registerComplaint(req.user.id, req.body);
            res.json({ success: true, message: "Complaint registered", data: result });
        } catch (err) { next(err); }
    }

    async getComplaint(req, res, next) {
        try {
            const result = await enforcementService.getComplaint(req.params.id);
            res.json({ success: true, data: result });
        } catch (err) { next(err); }
    }

    async updateComplaintStatus(req, res, next) {
        try {
            const result = await enforcementService.updateComplaintStatus(req.params.id, req.user.id, req.body);
            res.json({ success: true, message: "Complaint status updated", data: result });
        } catch (err) { next(err); }
    }

    async getApprovalQueue(req, res, next) {
        try {
            const results = await enforcementService.getApprovalQueue(req.user.id, req.query);
            res.json({ success: true, data: results });
        } catch (err) { next(err); }
    }

    async issueNOC(req, res, next) {
        try {
            const result = await enforcementService.issueNOC(
                req.params.id,
                req.user.id,
                req.body
            );
            res.status(200).json({
                success: true,
                data: result,
                message: "NOC issued successfully"
            });
        } catch (err) { next(err); }
    }

    async returnToSGWA(req, res, next) {
        try {
            const result = await enforcementService.returnToSGWA(
                req.params.id,
                req.user.id,
                req.body
            );
            res.status(200).json({ success: true, message: "Application returned to SGWA", data: result });
        } catch (err) { next(err); }
    }

    async getComplianceStats(req, res, next) {
        try {
            const stats = await enforcementService.getComplianceStats(req.user.id);
            res.status(200).json({ success: true, data: stats });
        } catch (err) { next(err); }
    }

    async revokeNOC(req, res, next) {
        try {
            const result = await enforcementService.revokeNOC(req.params.id, req.user.id, req.body);
            res.status(200).json({ success: true, message: "NOC revoked", data: result });
        } catch (err) { next(err); }
    }

    async getDashboardStats(req, res, next) {
        try {
            const stats = await enforcementService.getDashboardStats(req.user.id);

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new EnforcementController();
