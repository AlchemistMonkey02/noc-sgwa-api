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
            const [stats, recentApplications, announcements, deadlines] = await Promise.all([
                dashboardService.getDashboardStats(userId),
                dashboardService.getRecentApplications(userId, 5),
                dashboardService.getAnnouncements(),
                dashboardService.getUpcomingDeadlines(userId)
            ]);

            res.status(200).json({
                success: true,
                data: {
                    stats,
                    recentApplications,
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
