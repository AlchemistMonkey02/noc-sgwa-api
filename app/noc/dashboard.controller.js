const dashboardService = require("./dashboard.service");

class DashboardController {
    /**
     * GET /api/noc/dashboard
     * Get comprehensive dashboard data (stats + recent applications)
     */
    async getDashboardData(req, res, next) {
        try {
            const userId = req.user.id;

            // Parallel execution
            const [stats, recentApplications, approvedApplications, announcements, deadlines] = await Promise.all([
                dashboardService.getDashboardStats(userId),
                dashboardService.getRecentApplications(userId, 8),
                dashboardService.getApprovedApplications(userId),
                dashboardService.getAnnouncements(),
                dashboardService.getUpcomingDeadlines(userId)
            ]);

            res.status(200).json({
                success: true,
                data: {
                    stats,
                    recentApplications,
                    approvedApplications,
                    announcements,
                    deadlines
                },
                message: "Dashboard data retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DashboardController();
