const Inspection = require("./inspection.model");
const NOCApplication = require("../../noc/noc-application.model");
const logger = require("../../utils/logger");
const { v4: uuidv4 } = require("uuid");

class InspectionService {

    /**
     * Get Dashboard Stats for Inspection Officer
     */
    async getDashboardStats(officerId) {
        try {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const [todayCount, pendingCount, completedMonth, overdueCount] = await Promise.all([
                Inspection.countDocuments({
                    officerId,
                    scheduledDate: { $gte: todayStart, $lte: todayEnd },
                    status: "SCHEDULED"
                }),
                Inspection.countDocuments({ officerId, status: "SCHEDULED" }),
                Inspection.countDocuments({
                    officerId,
                    status: "COMPLETED",
                    completedAt: { $gte: startOfMonth }
                }),
                Inspection.countDocuments({
                    officerId,
                    status: "SCHEDULED",
                    scheduledDate: { $lt: todayStart }
                })
            ]);

            // Get Urgent/Upcoming Tasks
            const urgentTasks = await Inspection.find({ officerId, status: "SCHEDULED" })
                .sort({ scheduledDate: 1 })
                .limit(5)
                .populate("applicationId", "applicationNumber projectDetails location");

            return {
                stats: {
                    todayCount,
                    pendingCount,
                    completedMonth,
                    overdueCount
                },
                urgentTasks: urgentTasks.map(task => ({
                    inspectionId: task.inspectionId,
                    applicationNumber: task.applicationId?.applicationNumber,
                    applicantName: task.applicationId?.projectDetails?.applicantName,
                    location: `${task.applicationId?.location?.village}, ${task.applicationId?.location?.districtId}`,
                    scheduledDate: task.scheduledDate
                }))
            };
        } catch (error) {
            logger.error("Error fetching inspection dashboard", error);
            throw error;
        }
    }

    /**
     * Get Assigned Inspections
     */
    async getAssignedInspections(officerId, filters = {}) {
        try {
            const query = { officerId };

            if (filters.status) query.status = filters.status;
            if (filters.date) {
                const date = new Date(filters.date);
                const nextDate = new Date(date);
                nextDate.setDate(date.getDate() + 1);
                query.scheduledDate = { $gte: date, $lt: nextDate };
            }

            const inspections = await Inspection.find(query)
                .populate("applicationId")
                .sort({ scheduledDate: 1 });

            return inspections;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get Inspection Details
     */
    async getInspectionDetails(inspectionId, officerId) {
        try {
            const inspection = await Inspection.findOne({ inspectionId, officerId })
                .populate("applicationId");

            if (!inspection) throw { statusCode: 404, message: "Inspection not found" };

            return {
                inspectionId: inspection.inspectionId,
                status: inspection.status,
                scheduledDate: inspection.scheduledDate,
                application: {
                    id: inspection.applicationId._id,
                    number: inspection.applicationId.applicationNumber,
                    project: inspection.applicationId.projectDetails,
                    location: inspection.applicationId.location,
                    structures: inspection.applicationId.groundWaterStructures,
                    coordinates: {
                        lat: inspection.applicationId.location?.latitude,
                        lng: inspection.applicationId.location?.longitude
                    }
                },
                instructions: "Verify all borewells and water meter installation."
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Start/Check-In Inspection
     */
    async startInspection(inspectionId, officerId, data) {
        try {
            const inspection = await Inspection.findOne({ inspectionId, officerId });
            if (!inspection) throw { statusCode: 404, message: "Inspection not found" };

            inspection.status = "IN_PROGRESS";
            inspection.startedAt = new Date();
            inspection.checkInLocation = {
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: data.timestamp || new Date()
            };

            await inspection.save();
            return { message: "Check-in successful", status: inspection.status };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Submit Final Report
     */
    async submitReport(inspectionId, officerId, data) {
        try {
            const inspection = await Inspection.findOne({ inspectionId, officerId });
            if (!inspection) throw { statusCode: 404, message: "Inspection not found" };

            inspection.report = {
                ...data, // Spreads photos, geolocation, checklist
                submittedAt: new Date()
            };
            inspection.status = "COMPLETED";
            inspection.completedAt = new Date();
            inspection.isDraft = false;

            await inspection.save();

            // Optionally update Application Status
            const application = await NOCApplication.findById(inspection.applicationId);
            if (application) {
                application.status = "INSPECTED";
                application.approvalFlow.enforcement = application.approvalFlow.enforcement || {};
                application.approvalFlow.enforcement.inspectionReportVerified = true;
                application.approvalFlow.enforcement.inspectionDate = new Date();
                await application.save();
            }

            return { message: "Report submitted successfully" };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Save Draft Report
     */
    async saveDraft(inspectionId, officerId, data) {
        try {
            const inspection = await Inspection.findOne({ inspectionId, officerId });
            if (!inspection) throw { statusCode: 404, message: "Inspection not found" };

            inspection.report = data;
            inspection.isDraft = true;
            await inspection.save();

            return { message: "Draft saved successfully" };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get History
     */
    async getHistory(officerId) {
        try {
            return await Inspection.find({ officerId, status: "COMPLETED" })
                .sort({ completedAt: -1 })
                .populate("applicationId", "applicationNumber projectDetails");
        } catch (error) {
            throw error;
        }
    }

    /**
     * Assign Inspection
     */
    async createAssignment(applicationId, officerId, scheduledDate) {
        const inspection = new Inspection({
            inspectionId: uuidv4(),
            applicationId,
            officerId,
            scheduledDate,
            status: "SCHEDULED"
        });
        await inspection.save();
        return inspection;
    }
}

module.exports = new InspectionService();
