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
                // Parse date string (e.g., "2026-03-14") and create range for that day in server local time
                const [year, month, day] = filters.date.split('-').map(Number);
                const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
                const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
                query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
            }

            const inspections = await Inspection.find(query)
                .populate("applicationId")
                .sort({ scheduledDate: 1 });

            return inspections.map(ins => ({
                inspectionId: ins.inspectionId,
                status: ins.status,
                scheduledDate: ins.scheduledDate,
                applicationNumber: ins.applicationId?.applicationNumber,
                applicantName: ins.applicationId?.projectDetails?.applicantName || ins.applicationId?.applicantName,
                holderName: ins.applicationId?.projectDetails?.applicantName || ins.applicationId?.applicantName, // Added for frontend mapping
                location: ins.applicationId?.location?.village || ins.applicationId?.address,
                inspectionType: ins.applicationId?.applicationType || 'General',
                priority: ins.priority || 'MEDIUM' // Added priority
            }));
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
                applicationNumber: inspection.applicationId.applicationNumber,
                applicantName: inspection.applicationId.projectDetails?.applicantName || inspection.applicationId.applicantName,
                projectType: inspection.applicationId.projectDetails?.projectType || inspection.applicationId.applicationType,
                locationDetails: inspection.applicationId.location,
                existingSources: inspection.report?.existingSources || 0,
                groundWaterStructures: inspection.applicationId.groundWaterStructures,
                coordinates: {
                    lat: inspection.applicationId.location?.latitude,
                    lng: inspection.applicationId.location?.longitude
                },
                projectDetails: inspection.applicationId.projectDetails,
                applicantDetails: inspection.applicationId.applicantDetails,
                instructions: inspection.instructions || "Verify all borewells and water meter installation."
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
                locationMatch: data.locationMatch === 'Yes',
                landUseMatch: data.landUseMatch === 'Yes',
                borewellExists: data.borewellExists === 'Yes',
                waterSource: data.waterSource,
                meterInstalled: data.meterInstalled === 'Yes' ? 'YES' : 'NO',
                meterReading: data.meterReading ? parseFloat(data.meterReading) : 0,
                piezometerInstalled: data.piezometerInstalled === 'Yes',
                dwraDetails: data.dwraDetails,
                rainwaterHarvesting: data.rainwaterHarvesting || 'NOT_STARTED',
                plantationStatus: data.plantationStatus || 'NOT_STARTED',
                remarks: data.remarks,
                recommendation: data.recommendation === 'REJECTED' ? 'NOT_RECOMMENDED' : data.recommendation,
                photos: data.photos || [],
                geoLocation: data.coordinates ? {
                    lat: parseFloat(data.coordinates.split(',')[0]),
                    lng: parseFloat(data.coordinates.split(',')[1])
                } : null,
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
     * Get Inspection Report
     */
    async getReport(inspectionId, officerId) {
        try {
            const inspection = await Inspection.findOne({ inspectionId, officerId })
                .populate("applicationId");
            if (!inspection) throw { statusCode: 404, message: "Inspection not found" };
            return {
                ...inspection.report.toObject ? inspection.report.toObject() : inspection.report,
                inspectionId: inspection.inspectionId,
                applicationNumber: inspection.applicationId.applicationNumber,
                holderName: inspection.applicationId.projectDetails?.applicantName || inspection.applicationId.applicantName,
                applicantName: inspection.applicationId.projectDetails?.applicantName || inspection.applicationId.applicantName,
                address: inspection.applicationId.location?.village || inspection.applicationId.address,
                location: inspection.applicationId.location?.village || inspection.applicationId.address,
                projectType: inspection.applicationId.projectDetails?.projectType || inspection.applicationId.applicationType,
                inspectionDate: inspection.scheduledDate,
                submittedAt: inspection.completedAt,
                officerId: inspection.officerId
            };
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

    /**
     * Update Inspection Status (Respond to Assignment)
     */
    async updateInspectionStatus(inspectionId, officerId, status, remarks) {
        try {
            const inspection = await Inspection.findOne({ inspectionId, officerId });
            if (!inspection) {
                throw { statusCode: 404, message: "Inspection not found" };
            }

            inspection.status = status;
            if (remarks) inspection.report.remarks = remarks;
            await inspection.save();

            return inspection;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new InspectionService();
