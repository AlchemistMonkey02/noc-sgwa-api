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
        let applications = await NOCApplication.find({ userId })
            .sort({ updatedAt: -1 })
            .limit(limit)
            .select("applicationNumber projectDetails.projectName status updatedAt applicationType trackingId")
            .lean();

        // Map applicationType (numeric ID) to Name using ApplicationType model
        // Define model if not already defined (using loose schema as in master-data.controller.js)
        if (applications.length > 0) {
            try {
                // Use existing model if registered, or define it (schema must match database)
                const ApplicationType = mongoose.models.ApplicationType || mongoose.model('ApplicationType', new mongoose.Schema({ id: Number, name: String, isActive: Boolean }), 'applicationtypes');

                // Get unique IDs (ensure they are numbers)
                const typeIds = [...new Set(applications.map(app => parseInt(app.applicationType)).filter(id => !isNaN(id)))];

                if (typeIds.length > 0) {
                    const types = await ApplicationType.find({ id: { $in: typeIds } }).select("id name");

                    const typeMap = {};
                    types.forEach(t => {
                        typeMap[t.id] = t.name;
                    });

                    applications.forEach(app => {
                        const typeId = parseInt(app.applicationType);
                        if (!isNaN(typeId) && typeMap[typeId]) {
                            app.applicationTypeName = typeMap[typeId];
                        }
                    });
                }
            } catch (err) {
                logger.error("Error fetching application types for dashboard", err);
            }
        }

        return applications;
    }
}

const mongoose = require("mongoose");
module.exports = new DashboardService();
