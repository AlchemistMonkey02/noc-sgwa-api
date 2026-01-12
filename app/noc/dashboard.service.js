const NOCApplication = require("./noc-application.model");
const logger = require("../utils/logger");

class DashboardService {
    /**
     * Get dashboard statistics for a user
     * @param {string} userId - User ID
     */
    async getDashboardStats(userId) {
        // Aggregation pipeline to group by status
        const stats = await NOCApplication.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Default counters
        let total = 0;
        let drafts = 0;
        let submitted = 0;
        let approved = 0;
        let rejected = 0;
        let queries = 0;

        // Map status to categories
        stats.forEach(item => {
            const count = item.count;
            const status = item._id;
            total += count;

            if (status === "DRAFT") {
                drafts += count;
            } else if (status === "NOC_ISSUED") {
                approved += count;
            } else if (status.includes("REJECTED")) {
                rejected += count;
            } else if (status.includes("QUERY")) {
                queries += count;
                submitted += count; // Queries are also in-process
            } else {
                // All other statuses are considered "In Process" / Submitted
                submitted += count;
            }
        });

        return {
            totalApplications: total,
            inDraft: drafts,
            inProcess: submitted - queries, // Purely in process (no query pending)
            queriesRaised: queries,
            approved: approved,
            rejected: rejected
        };
    }

    /**
     * Get recent applications for a user
     * @param {string} userId 
     * @param {number} limit 
     */
    async getRecentApplications(userId, limit = 5) {
        return await NOCApplication.find({ userId })
            .sort({ updatedAt: -1 })
            .limit(limit)
            .select("applicationNumber projectDetails.projectName status updatedAt applicationType trackingId")
            .lean();
    }
}

const mongoose = require("mongoose");
module.exports = new DashboardService();
