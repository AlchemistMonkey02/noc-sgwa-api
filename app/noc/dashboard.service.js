const NOCApplication = require("./noc-application.model");
const logger = require("../utils/logger");

class DashboardService {
    /**
     * Get dashboard statistics for a user
     * @param {string} userId - User ID
     */
    async getDashboardStats(userId) {
        // Aggregation pipeline to group by status
        // Handle both ObjectId and string formats for userId robustly
        const matchQuery = {
            $or: [
                { userId: new mongoose.Types.ObjectId(userId) },
                { userId: userId.toString() }
            ]
        };

        const stats = await NOCApplication.aggregate([
            { $match: matchQuery },
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
            const status = item._id?.toUpperCase() || "";
            total += count;

            if (status === "DRAFT") {
                drafts += count;
            } else if (status === "NOC_ISSUED" || status === "APPROVED" || status === "EXEMPT") {
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
        // Handle both ObjectId and string formats for userId robustly
        const matchQuery = {
            $or: [
                { userId: new mongoose.Types.ObjectId(userId) },
                { userId: userId.toString() }
            ]
        };

        let applications = await NOCApplication.find(matchQuery)
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
    /**
     * Get system announcements
     */
    async getAnnouncements() {
        // This could be fetched from an Announcements model in the future
        return [
            {
                type: "NEW",
                title: "Revised Water Extraction Charges",
                description: "New tariff rates effective from January 1, 2026",
                date: "2026-01-01"
            },
            {
                type: "IMPORTANT",
                title: "Mandatory Piezometer Installation",
                description: "Required for all industries in semi-critical blocks",
                date: "2025-12-15"
            }
        ];
    }

    /**
     * Get upcoming deadlines for the user
     * @param {string} userId
     */
    async getUpcomingDeadlines(userId) {
        // This could fetch pending compliance reports, query responses etc.
        // For now, returning a realistic mock-dynamic set
        return [
            {
                task: "Q4 2025 Compliance Report",
                dueDate: "2026-01-15",
                daysLeft: 7,
                type: "COMPLIANCE"
            },
            {
                task: "Meter Reading Submission",
                dueDate: "2026-01-10",
                daysLeft: 2,
                type: "METER"
            }
        ];
    }
}

const mongoose = require("mongoose");
module.exports = new DashboardService();
