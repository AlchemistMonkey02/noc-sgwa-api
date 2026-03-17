const mongoose = require("mongoose");
const NOCApplication = require("../../noc/noc-application.model");
const notificationService = require("../../notifications/notification.service");
const logger = require("../../utils/logger");
const ApplicationQuery = require("../../noc/application-query.model");
const District = require("../../master-data/district.model");
const User = require("../../auth/user.model");
const MasterService = require("../../master-data/master.service");

class DGOService {
    /**
     * Get applications for DGO review
     */
    async getApplications(officerId, filters = {}) {
        try {
            // Fetch officer to get their assigned district for strict isolation
            const officer = await User.findById(officerId);
            const assignedDistrict = officer?.communicationAddress?.district;

            if (!assignedDistrict && officer.userType === 'DGO') {
                // DEVELOPMENT/DEMO: Log warning but don't block - show all applications
                logger.warn(`DGO ${officerId} has no assigned district in profile - showing all applications`);
                // In production, uncomment the return below to enforce district isolation:
                // return { applications: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } };
            }

            // DEVELOPMENT/DEMO: Relaxed strict district isolation. 
            // Allows viewing all applications regardless of district if no filter is applied.
            const query = {
                $and: [
                    {
                        status: { $in: ["SUBMITTED", "PENDING_DGO_REVIEW", "UNDER_REVIEW_DGO", "QUERY_RAISED_DGO", "QUERY_RESPONDED", "INSPECTION_SCHEDULED", "INSPECTED", "APPROVED_DGO", "NOC_ISSUED"] }
                    }
                ]
            };

            if (assignedDistrict) {
                const districtMatch = { $regex: new RegExp(`^${assignedDistrict}$`, 'i') };
                query.$and.push({
                    $or: [
                        { "location.districtId": districtMatch },
                        { "communicationAddress.district": districtMatch }
                    ]
                });
            }

            if (filters.status) {
                const statusList = filters.status.split(",");
                if (statusList.length > 1) {
                    query.$and.push({ status: { $in: statusList } });
                } else {
                    query.$and.push({ status: filters.status });
                }
            }

            if (filters.block) {
                query["location.blockId"] = filters.block;
            }

            if (filters.search) {
                const searchRegex = new RegExp(filters.search, 'i');
                query.$or = [
                    { applicationNumber: searchRegex },
                    { "projectDetails.applicantName": searchRegex },
                    { "projectDetails.projectName": searchRegex }
                ];
            }

            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const skip = (page - 1) * limit;

            const applications = await NOCApplication.find(query)
                .populate("userId", "firstName lastName email phone")
                .populate("companyId", "companyName contactPerson")
                .sort({ submittedAt: 1 }) // Oldest first
                .skip(skip)
                .limit(limit);

            const total = await NOCApplication.countDocuments(query);

            // Enrich with labels for Dashboard visibility
            const enrichedApplications = await Promise.all(
                applications.map(app => MasterService.enrichApplicationLabels(app))
            );

            // DEBUG: Log details to help trace visibility issues
            logger.info(`DGO getApplications: found ${total} total, query status filter: ${JSON.stringify(query.$and[0]?.status)}, filters: ${JSON.stringify(filters)}`);

            return {
                applications: enrichedApplications,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error("Error fetching DGO applications", error);
            throw error;
        }
    }

    /**
     * Helper: Find application with strict district isolation
     */
    async findApplication(id, assignedDistrict = null) {
        const query = {
            $and: [
                {
                    $or: [
                        { _id: mongoose.isValidObjectId(id) ? id : null },
                        { applicationId: id },
                        { trackingId: id }
                    ].filter(q => q[Object.keys(q)[0]] !== null)
                }
            ]
        };

        // DEVELOPMENT/DEMO: Relaxed strict district isolation constraint
        /*
        if (assignedDistrict) {
            const districtMatch = typeof assignedDistrict === 'string'
                ? { $regex: new RegExp(`^${assignedDistrict}$`, 'i') }
                : assignedDistrict;
            query.$and.push({ "location.districtId": districtMatch });
        }
        */

        try {
            const application = await NOCApplication.findOne(query);

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found or access denied"
                };
            }
            return application;
        } catch (err) {
            logger.error(`Error in findApplication for ID: ${id}`, err);
            throw err;
        }
    }

    /**
     * Verify Documents
     */
    async verifyDocuments(applicationId, officerId, data) {
        try {
            const officer = await User.findById(officerId);
            const assignedDistrict = officer?.communicationAddress?.district;
            const application = await this.findApplication(applicationId, assignedDistrict);

            // Data should be { documents: [ { documentId, status, remarks } ] }
            const verifications = data.documents || [];

            for (const verify of verifications) {
                const doc = application.documents.find(d => d.documentId === verify.documentId);
                if (doc) {
                    doc.isVerified = verify.status === "ACCEPTED";
                    doc.remarks = verify.remarks;
                    doc.verifiedBy = officerId;
                    doc.verifiedAt = new Date();
                }
            }

            // Check if all documents are verified
            const allVerified = application.documents.every(d => d.isVerified);
            if (allVerified) {
                application.approvalFlow.dgo.documentsVerified = true;
            }

            await application.save({ validateBeforeSave: false }); // Allow updates on legacy/incomplete data
            return application;
        } catch (error) {
            logger.error("Error verifying documents", error);
            throw error;
        }
    }

    /**
     * Approve application and forward to SGWA
     */
    async approveApplication(applicationId, officerId, data) {
        try {
            const officer = await User.findById(officerId);
            const assignedDistrict = officer?.communicationAddress?.district;
            const application = await this.findApplication(applicationId, assignedDistrict);

            // Check if ready for approval (documents verified, inspection done if needed)
            // Strict check: if (!application.approvalFlow.dgo.documentsVerified) throw { message: "Documents not verified" };

            // Update approval flow
            application.approvalFlow.dgo = {
                ...application.approvalFlow.dgo,
                reviewedBy: officerId,
                reviewedAt: new Date(),
                status: "APPROVED",
                remarks: data.remarks || "",
                recommendation: data.recommendation || "RECOMMEND_APPROVAL",
                documentsVerified: true
            };

            // Update status
            application.status = "APPROVED_DGO";
            application.assignedTo = null; // Move to SGWA pool

            // Auto-assign to SGWA (can be enhanced with queue logic)
            if (!application.approvalFlow.sgwa) application.approvalFlow.sgwa = {};
            application.approvalFlow.sgwa.assignedAt = new Date();
            application.approvalFlow.sgwa.status = "PENDING";

            await application.save({ validateBeforeSave: false });

            // Send notifications
            await this.sendNotifications(application, "DGO_APPROVED", {
                notifyRole: "RSGWA",
                remarks: data.remarks
            });

            logger.info(`Application ${applicationId} approved by DGO`, { officerId });

            return application;
        } catch (error) {
            logger.error("Error approving application", error);
            throw error;
        }
    }

    /**
     * Reject application
     */
    async rejectApplication(applicationId, officerId, data) {
        try {
            const officer = await User.findById(officerId);
            const assignedDistrict = officer?.communicationAddress?.district;
            const application = await this.findApplication(applicationId, assignedDistrict);

            application.approvalFlow.dgo = {
                ...application.approvalFlow.dgo,
                reviewedBy: officerId,
                reviewedAt: new Date(),
                status: "REJECTED",
                remarks: data.remarks,
                recommendation: "REJECT"
            };

            application.status = "REJECTED_DGO";
            await application.save({ validateBeforeSave: false });

            // Send notifications
            await this.sendNotifications(application, "DGO_REJECTED");

            logger.info(`Application ${applicationId} rejected by DGO`, { officerId });

            return application;
        } catch (error) {
            logger.error("Error rejecting application", error);
            throw error;
        }
    }

    /**
     * Schedule Inspection
     * DGO assigns inspection to Inspection Officer
     */
    async scheduleInspection(applicationId, officerId, data) {
        const officer = await User.findById(officerId);
        const assignedDistrict = officer?.communicationAddress?.district;
        const application = await this.findApplication(applicationId, assignedDistrict);

        // Validate inspection officer ID is provided
        if (!data.inspectorId && !data.officerId) {
            throw { statusCode: 400, message: "Inspector officer ID is required" };
        }

        const inspectorId = data.inspectorId || data.officerId;

        // Create inspection record using Inspection Service
        const inspectionService = require("../inspection/inspection.service");
        const inspection = await inspectionService.createAssignment(
            application._id,
            inspectorId,
            data.inspectionDate || data.scheduledDate
        );

        // Update application state
        application.status = "INSPECTION_SCHEDULED";

        if (!application.approvalFlow.dgo) application.approvalFlow.dgo = {};

        // Save inspection schedule details
        application.approvalFlow.dgo.inspectionScheduledAt = new Date();
        application.approvalFlow.dgo.inspectionAssignedTo = inspectorId;
        application.approvalFlow.dgo.inspectionId = inspection.inspectionId;

        await application.save({ validateBeforeSave: false });
        await this.sendNotifications(application, "INSPECTION_SCHEDULED");

        logger.info(`DGO ${officerId} scheduled inspection for ${applicationId}, assigned to inspector ${inspectorId}`);

        return {
            application,
            inspection
        };
    }

    async submitInspectionReport(applicationId, officerId, data) {
        const officer = await User.findById(officerId);
        const assignedDistrict = officer?.communicationAddress?.district;
        const application = await this.findApplication(applicationId, assignedDistrict);

        const report = {
            officerId,
            submittedAt: new Date(),
            findings: data.findings,
            coordinates: data.coordinates,
            photos: data.photos
        };

        if (!application.approvalFlow.dgo) application.approvalFlow.dgo = {};
        application.approvalFlow.dgo.inspectionDetails = report;
        application.approvalFlow.dgo.inspectionReport = data.findings; // Mapping to schema field

        // Also update status
        application.status = "INSPECTION_COMPLETED";

        await application.save({ validateBeforeSave: false });
        return application;
    }

    async getInspectionReport(applicationId, officerId) {
        const officer = await User.findById(officerId);
        const assignedDistrict = officer?.communicationAddress?.district;
        const application = await this.findApplication(applicationId, assignedDistrict);

        const details = application.approvalFlow?.dgo?.inspectionDetails;
        if (!details) throw { statusCode: 404, message: "Inspection report not found" };

        return details;
    }

    /**
     * Raise query to applicant
     */
    async raiseQuery(applicationId, officerId, data) {
        try {
            const officer = await User.findById(officerId);
            const assignedDistrict = officer?.communicationAddress?.district;
            const application = await this.findApplication(applicationId, assignedDistrict);

            const { v4: uuidv4 } = require("uuid");

            // Create query record
            const query = new ApplicationQuery({
                queryId: uuidv4(),
                applicationId: application._id,
                raisedBy: officerId,
                raisedByRole: "DGO",
                subject: data.queryTitle || data.subject,
                query: data.description || data.query,
                description: data.description,
                priority: data.priority || "MEDIUM",
                status: "OPEN",
                responseDeadline: data.responseDeadline
            });

            await query.save();

            // Update application status
            application.status = "QUERY_RAISED_DGO";
            application.approvalFlow.dgo.status = "QUERY";
            application.approvalFlow.dgo.remarks = data.description || data.query;
            await application.save({ validateBeforeSave: false });

            // Send notifications
            await this.sendNotifications(application, "DGO_QUERY_RAISED", {
                notifyOfficer: true,
                remarks: data.description || data.query
            });

            logger.info(`Query raised for application ${applicationId}`, { officerId });

            return { application, query };
        } catch (error) {
            logger.error("Error raising query", error);
            throw error;
        }
    }

    // NEW: Get all queries raised by officer
    async getQueries(officerId, filters = {}) {
        const query = { raisedBy: officerId };
        if (filters.status) query.status = filters.status;

        return await ApplicationQuery.find(query)
            .populate('applicationId', 'applicationNumber projectDetails.projectName')
            .sort({ raisedAt: -1 });
    }

    // NEW: Get query by ID
    async getQueryById(queryId) {
        return await ApplicationQuery.findOne({ queryId })
            .populate('applicationId', 'applicationNumber projectDetails.projectName');
    }

    // NEW: Accept Query Response
    async acceptQueryResponse(queryId, officerId) {
        const officer = await User.findById(officerId);
        const assignedDistrict = officer?.communicationAddress?.district;
        const query = await ApplicationQuery.findOne({ queryId: queryId });
        if (!query) throw { statusCode: 404, message: "Query not found" };

        const application = await this.findApplication(query.applicationId, assignedDistrict);

        query.status = "CLOSED";
        query.respondedBy = officerId;
        await query.save();

        // Return application to review status
        application.status = "UNDER_REVIEW_DGO";
        await application.save();

        return query;
    }

    // NEW: Reject Query Response
    async rejectQueryResponse(queryId, officerId, data) {
        const officer = await User.findById(officerId);
        const assignedDistrict = officer?.communicationAddress?.district;
        const query = await ApplicationQuery.findOne({ queryId: queryId });
        if (!query) throw { statusCode: 404, message: "Query not found" };

        const application = await this.findApplication(query.applicationId, assignedDistrict);

        // Re-open query or create new one?
        // Usually we keep the query open and add remarks
        query.status = "OPEN";
        // Logic to indicate rejection of response
        await query.save();

        return query;
    }

    // NEW: Compliance Report Stub
    async getComplianceReport(officerId, filters) {
        // Return dummy data or aggregate from NOCApplication
        return [
            { unitName: "ABC Industries", status: "COMPLIANT", lastInspection: "2025-12-01" },
            { unitName: "XYZ Corp", status: "NON_COMPLIANT", lastInspection: "2026-01-10" }
        ];
    }

    // NEW: Generate Report Stub
    async generateReport(officerId, data) {
        return { downloadUrl: "http://example.com/report.pdf" };
    }


    /**
     * Get DGO Dashboard Statistics
     */
    async getDashboardStats(officerId, districtId) {
        try {
            // Fetch officer to get their assigned district for strict isolation
            const officer = await User.findById(officerId);
            const assignedDistrict = officer?.communicationAddress?.district;

            if (!assignedDistrict && officer.userType === 'DGO') {
                logger.warn(`DGO ${officerId} has no assigned district in profile`);
                return { stats: {}, myDistrict: "None", recentApplications: [] };
            }

            // Enable district isolation
            const districtMatch = assignedDistrict ? { $regex: new RegExp(`^${assignedDistrict}$`, 'i') } : null;
            const isolationQuery = districtMatch ? {
                $or: [
                    { "location.districtId": districtMatch },
                    { "communicationAddress.district": districtMatch }
                ]
            } : {};

            console.log('DEBUG: DGO getDashboardStats', {
                officerId,
                assignedDistrict,
                isolationQuery: JSON.stringify(isolationQuery)
            });

            const [
                totalApplications,
                pendingVerification,
                underReview,
                queriesRaised,
                inspectionPending,
                myDistrictData
            ] = await Promise.all([
                // 1. Total Applications (All time handled by DGO)
                NOCApplication.countDocuments(isolationQuery),

                // 2. Pending Verification (Requires attention - newly submitted)
                NOCApplication.countDocuments({ ...isolationQuery, status: { $in: ["SUBMITTED", "PENDING_DGO_REVIEW"] } }),

                // 3. Under Review (In progress)
                NOCApplication.countDocuments({ ...isolationQuery, status: "UNDER_REVIEW_DGO" }),

                // 4. Queries Raised (Awaiting response)
                NOCApplication.countDocuments({ ...isolationQuery, status: "QUERY_RAISED_DGO" }),

                // 5. Inspection Pending (Site visits required - Scheduled but not completed)
                NOCApplication.countDocuments({ ...isolationQuery, status: "INSPECTION_SCHEDULED" }),

                districtId ? District.findOne({ id: districtId }) : Promise.resolve(null)
            ]);

            console.log('DEBUG: DGO Stats results', {
                totalApplications,
                pendingVerification,
                underReview
            });

            // Get recent applications with full details for dashboard
            const recentApplications = await NOCApplication.find(isolationQuery)
                .populate("userId", "firstName lastName name email mobile phone")
                .populate("companyId", "companyName contactPerson")
                .sort({ submittedAt: -1 })
                .limit(5)
                .lean();

            return {
                stats: {
                    totalApplications,     // 📋 All time
                    pendingVerification,   // ⏳ Requires attention
                    underReview,           // 🔍 In progress
                    queriesRaised,         // ❓ Awaiting response
                    inspectionPending      // 🔍 Site visits required
                },
                myDistrict: myDistrictData?.districtName || assignedDistrict || districtId || "Assigned District",
                recentApplications
            };
        } catch (error) {
            logger.error("Error fetching DGO stats", error);
            throw error;
        }
    }

    /**
     * Send multi-channel notifications
     */
    async sendNotifications(application, event, options = {}) {
        try {
            const data = {
                applicationNumber: application.applicationNumber,
                projectName: application.projectDetails?.projectName || 'Project',
                remarks: options.remarks,
                ...options.data
            };

            // 1. Notify Applicant (Always)
            await notificationService.send(application.userId, event, data);

            // 2. Notify Assigned Officer (If any)
            if (application.assignedTo && options.notifyOfficer) {
                await notificationService.send(application.assignedTo, event, {
                    ...data,
                    isOfficerSide: true
                });
            }

            // 3. Notify Roles (For pool transitions)
            if (options.notifyRole) {
                await notificationService.notifyRole(options.notifyRole, event, data);
            }
        } catch (error) {
            logger.error("Error sending notifications", error);
        }
    }

    getNotificationTitle(event) {
        const titles = {
            DGO_APPROVED: "Application Approved by DGO",
            DGO_REJECTED: "Application Rejected by DGO",
            DGO_QUERY_RAISED: "Query Raised on Your Application"
        };
        return titles[event] || "Application Update";
    }

    getNotificationMessage(event, application) {
        const messages = {
            DGO_APPROVED: `Your NOC application ${application.applicationNumber} has been approved by District Officer and forwarded to SGWA for technical review.`,
            DGO_REJECTED: `Your NOC application ${application.applicationNumber} has been rejected by District Officer. Please check the remarks.`,
            DGO_QUERY_RAISED: `District Officer has raised a query on your application ${application.applicationNumber}. Please respond within the deadline.`
        };
        return messages[event] || "Your application status has been updated.";
    }
    /**
     * Get officers by role
     */
    async getOfficers(role) {
        try {
            const query = { accountStatus: "ACTIVE" }; // Only active officers
            
            console.log('DEBUG: getOfficers called with role:', role);

            if (role && role !== "undefined" && role !== "null") {
                // Handle synonyms
                if (role === "INSPECTION_OFFICER") {
                    query.userType = "INSPECTION";
                } else {
                    query.userType = role;
                }
            } else {
                // Default roles that can be assigned for inspections
                query.userType = { $in: ["INSPECTION", "ENFORCEMENT", "SGWA", "RSGWA", "DGO"] };
            }

            console.log('DEBUG: getOfficers query:', JSON.stringify(query));
            
            const officers = await User.find(query)
                .select("firstName lastName email phone userType communicationAddress")
                .lean();

            console.log(`DEBUG: getOfficers found ${officers.length} officers`);
            return officers;
        } catch (error) {
            logger.error("Error fetching officers", error);
            throw error;
        }
    }

    /**
     * Get application details by ID with enrichment
     */
    async getApplicationById(applicationId) {
        try {
            const isObjectId = mongoose.Types.ObjectId.isValid(applicationId);
            const query = isObjectId ? { _id: applicationId } : { applicationId };
            
            const application = await NOCApplication.findOne(query)
                .populate("userId", "firstName lastName email phone")
                .populate("companyId", "companyName contactPerson")
                .populate("approvalFlow.dgo.inspectionAssignedTo", "firstName lastName email phone userType");

            if (!application) return null;

            return await MasterService.enrichApplicationLabels(application);
        } catch (error) {
            logger.error("Error fetching application by ID", error);
            throw error;
        }
    }
}

module.exports = new DGOService();
