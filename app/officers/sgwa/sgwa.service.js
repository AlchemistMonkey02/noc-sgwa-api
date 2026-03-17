const mongoose = require("mongoose");
const NOCApplication = require("../../noc/noc-application.model");
const notificationService = require("../../notifications/notification.service");
const logger = require("../../utils/logger");
const MasterService = require("../../master-data/master.service");

class SGWAService {
    async assignApplication(applicationId, currentOfficerId, data) {
        try {
            const isObjectId = mongoose.Types.ObjectId.isValid(applicationId);
            const query = isObjectId ? { _id: applicationId } : { applicationId };
            const application = await NOCApplication.findOne(query);
            const { officerId, remarks } = data; // officerId is the target assignee

            if (!application) throw { statusCode: 404, message: "Application not found" };

            // Initialize sgwa object if missing
            if (!application.approvalFlow.sgwa) application.approvalFlow.sgwa = {};

            application.approvalFlow.sgwa.assignedOfficer = officerId;
            application.approvalFlow.sgwa.assignedAt = new Date();
            application.approvalFlow.sgwa.assignedBy = currentOfficerId;
            application.approvalFlow.sgwa.assignmentRemarks = remarks;

            // Optionally update status to UNDER_REVIEW if it was pending
            if (application.status === 'PENDING_SGWA_REVIEW') {
                application.status = 'UNDER_REVIEW_SGWA';
            }

            await application.save();
            logger.info(`Application ${applicationId} assigned to officer ${officerId}`);
            return application;
        } catch (error) {
            logger.error("Error assigning application", error);
            throw error;
        }
    }

    /**
     * Get applications for SGWA review (DGO approved)
     */
    async getApplications(officerId, filters = {}) {
        try {
            // Base: all statuses SGWA can see
            const sgwaStatuses = ["APPROVED_DGO", "PENDING_SGWA_REVIEW", "UNDER_REVIEW_SGWA", "QUERY_RAISED_SGWA", "QUERY_RESPONDED"];

            const query = {
                // If a specific status filter is given, use it; otherwise show all SGWA-relevant statuses
                status: filters.status ? filters.status : { $in: sgwaStatuses }
            };

            // If myTasksOnly is specified, filter by assigned officer
            if (filters.myTasksOnly === 'true' || filters.myTasksOnly === true) {
                query.assignedTo = officerId;
            }

            if (filters.search) {
                const searchRegex = new RegExp(filters.search, 'i');
                query.$or = [
                    { applicationNumber: searchRegex },
                    { "projectDetails.projectName": searchRegex },
                    { "projectDetails.applicantName": searchRegex }
                ];
            }

            if (filters.dateFrom && filters.dateTo) {
                query.submittedAt = {
                    $gte: new Date(filters.dateFrom),
                    $lte: new Date(filters.dateTo)
                };
            }

            if (filters.district) query["location.districtId"] = filters.district;
            if (filters.dgoRecommendation) query["approvalFlow.dgo.recommendation"] = filters.dgoRecommendation;

            const sortOptions = {};
            if (filters.sortBy) {
                sortOptions[filters.sortBy] = filters.sortOrder === 'desc' ? -1 : 1;
            } else {
                sortOptions["submittedAt"] = -1;
            }

            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const skip = (page - 1) * limit;

            const applications = await NOCApplication.find(query)
                .populate("userId", "firstName lastName email phone")
                .populate("companyId", "companyName contactPerson")
                .populate("assignedTo", "firstName lastName designation")
                .sort(sortOptions)
                .skip(skip)
                .limit(limit);

            const total = await NOCApplication.countDocuments(query);

            // Enrich with labels for Dashboard visibility
            const enrichedApplications = await Promise.all(
                applications.map(app => MasterService.enrichApplicationLabels(app))
            );


            // Transform to response format - now returning full objects for frontend fallbacks
            const formattedApplications = applications.map(app => {
                const appObj = app.toObject();
                return {
                    ...appObj,
                    id: app.applicationId, // Maintain compatibility
                    applicantDetails: {
                        ...appObj.applicantDetails,
                        name: app.projectDetails?.applicantName || app.ownerDetails?.ownerName || app.applicantName,
                    }
                };
            });

            return {
                applications: enrichedApplications.map(app => ({
                    ...app,
                    id: app.applicationId,
                    applicantDetails: {
                        ...app.applicantDetails,
                        name: app.projectDetails?.applicantName || app.ownerDetails?.ownerName || app.applicantName,
                    }
                })),
                pagination: { page, limit, total, pages: Math.ceil(total / limit) },
                summary: {
                    totalApplications: total,
                    avgProcessingTime: "12.5 days" // Placeholder
                }
            };
        } catch (error) {
            logger.error("Error fetching SGWA applications", error);
            throw error;
        }
    }

    /**
     * Approve application and forward to Enforcement
     */
    async approveApplication(applicationId, officerId, data) {
        try {
            const isObjectId = mongoose.Types.ObjectId.isValid(applicationId);
            const query = isObjectId ? { _id: applicationId } : { applicationId };
            const application = await NOCApplication.findOne(query);

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found"
                };
            }

            const allowedStatuses = ["APPROVED_DGO", "PENDING_SGWA_REVIEW", "UNDER_REVIEW_SGWA", "PENDING_FINAL_APPROVAL", "QUERY_RESPONDED"];
            if (!allowedStatuses.includes(application.status)) {
                throw {
                    statusCode: 400,
                    code: "INVALID_STATUS",
                    message: "Application status must be DGO Approved or Under SGWA Review"
                };
            }

            // Update SGWA approval
            application.approvalFlow.sgwa = {
                reviewedBy: officerId,
                reviewedAt: new Date(),
                status: "APPROVED",
                remarks: data.remarks || "Approved",
                recommendation: "APPROVED", // Final SGWA decision
                technicalReview: data.technicalReview,
                proposedValidityYears: data.nocValidityYears || 3,
                conditions: data.conditions || [],
                cessAmount: data.cessAmount || 0
            };

            // Final Status - Forward to Enforcement for Final NOC Issuance
            application.status = "PENDING_FINAL_APPROVAL";
            application.assignedTo = null; // Move to Enforcement pool

            // Map validity to root fields if needed
            if (data.nocValidityYears) {
                application.validityPeriodRequested = data.nocValidityYears; // Or separate field
            }

            // Create NOC Certificate Stub (In real app, this would call CertificateService)
            const { v4: uuidv4 } = require("uuid");
            const nocDetails = {
                nocId: uuidv4(),
                nocNumber: data.nocNumber || `RJ/CGWA/NOC/${new Date().getFullYear()}/${application.applicationNumber.split('/').pop()}`,
                issueDate: new Date(),
                validFrom: new Date(),
                validUpto: data.validityDate ? new Date(data.validityDate) : new Date(new Date().setFullYear(new Date().getFullYear() + (data.nocValidityYears || 3)))
            };

            // Update Water Allocation if provided
            if (data.waterAllocation) {
                if (!application.waterRequirement) application.waterRequirement = {};
                application.waterRequirement.allocation = data.waterAllocation;
            }

            // Save NOC details to application (assuming flexible schema or strict mapping)
            // Ideally we should have a separate NOCCertificate model, but for now we attach to application response
            // For schema compliance, we might need to store this in a new field if strict.
            // checking schema: nocCertificateId ref exists. We won't create actual doc now to keep it simple unless requested.

            // Enforce validateBeforeSave: false to handle legacy/schema mismatches
            await application.save({ validateBeforeSave: false });

            // Send notifications
            await this.sendNotifications(application, "SGWA_APPROVED", {
                notifyRole: "ENFORCEMENT",
                remarks: data.remarks
            });

            logger.info(`Application ${applicationId} approved by SGWA`, { officerId });

            return {
                applicationId: application.applicationId,
                applicationNumber: application.applicationNumber,
                status: application.status,
                noc: nocDetails,
                approvalDetails: application.approvalFlow.sgwa
            };
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
            const isObjectId = mongoose.Types.ObjectId.isValid(applicationId);
            const query = isObjectId ? { _id: applicationId } : { applicationId };
            const application = await NOCApplication.findOne(query);

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found"
                };
            }

            application.approvalFlow.sgwa = {
                reviewedBy: officerId,
                reviewedAt: new Date(),
                status: "REJECTED",
                remarks: data.detailedRemarks || data.remarks,
                recommendation: "REJECT"
            };

            // Join reasons if array
            if (Array.isArray(data.rejectionReasons)) {
                application.rejectionReason = data.rejectionReasons.join(", ");
            } else {
                application.rejectionReason = data.reasonCode || data.primaryReason || "Rejected by SGWA";
            }

            application.status = "REJECTED_SGWA";
            await application.save({ validateBeforeSave: false });

            await this.sendNotifications(application, "SGWA_REJECTED", {
                notifyOfficer: true,
                remarks: data.detailedRemarks || data.remarks
            });

            logger.info(`Application ${applicationId} rejected by SGWA`, { officerId });

            return {
                applicationId: application.applicationId,
                status: application.status,
                rejectionDetails: {
                    rejectedBy: "SGWA Officer",
                    rejectedOn: new Date(),
                    reasons: data.rejectionReasons || [],
                }
            };
        } catch (error) {
            logger.error("Error rejecting application", error);
            throw error;
        }
    }

    async getApplicationById(applicationId) {
        try {
            const isObjectId = mongoose.Types.ObjectId.isValid(applicationId);
            const query = isObjectId ? { _id: applicationId } : { applicationId };
            const application = await NOCApplication.findOne(query)
                .populate("userId", "firstName lastName email phone")
                .populate("companyId", "companyName contactPerson")
                .populate("assignedTo", "firstName lastName designation");

            if (!application) {
                throw { statusCode: 404, message: "Application not found" };
            }

            // Construct response matching spec - returning full object for robust frontend display
            const enrichedApp = await MasterService.enrichApplicationLabels(application);
            
            return {
                application: {
                    ...enrichedApp,
                    id: application.applicationId,
                    applicationNumber: application.applicationNumber,
                    trackingId: application.trackingId,
                    
                    // Specific mapping for spec compatibility
                    applicantDetails: {
                        name: application.projectDetails?.applicantName || application.ownerDetails?.ownerName || application.applicantName || application.userId?.firstName + ' ' + application.userId?.lastName,
                        type: application.applicationSubTypeLabel || application.applicationTypeLabel || application.projectDetails?.organizationType || 'Noc',
                        contactPerson: application.companyId?.contactPerson || application.ownerDetails?.ownerName || application.projectDetails?.applicantName,
                        email: application.projectDetails?.email || application.ownerDetails?.ownerEmail || application.userId?.email,
                        phone: application.projectDetails?.mobile || application.ownerDetails?.ownerPhone || application.userId?.phone,
                        panNumber: application.projectDetails?.panNumber || application.applicantDetails?.panNumber
                    },
                    projectDetails: {
                        ...application.projectDetails,
                        projectName: application.projectDetails?.projectName || application.projectName || application.applicationNumber,
                        projectType: application.applicationSubTypeLabel ? `${application.applicationTypeLabel} (${application.applicationSubTypeLabel})` : (application.applicationTypeLabel || 'N/A'),
                        sector: application.projectDetails?.projectCategoryLabel || application.applicationSubTypeLabel || application.applicationTypeLabel || 'N/A'
                    },
                    locationDetails: application.location,
                    waterRequirement: application.waterRequirement,
                    status: application.status,
                    submittedDate: application.submittedAt,

                    // Specific mapping for spec
                    hydrogeologicalData: application.hydrogeology ? {
                        aquiferType: application.hydrogeology.aquiferType,
                        waterTableDepth: application.hydrogeology.staticWaterLevel,
                        waterQuality: application.hydrogeology.waterQuality,
                    } : {},

                    complianceChecklist: {
                        landOwnershipVerified: application.documents?.some(d => d.documentType === 'LAND_OWNERSHIP_PROOF' && d.isVerified),
                        environmentalClearance: application.documents?.some(d => d.documentType === 'ENVIRONMENTAL_CLEARANCE' && d.isVerified),
                        waterRequirementValidated: true
                    },

                    fees: application.feeDetails ? {
                        totalAmount: application.feeDetails.totalAmount,
                        paidAmount: application.feeDetails.isPaid ? application.feeDetails.totalAmount : 0,
                        paymentStatus: application.feeDetails.isPaid ? "PAID" : "PENDING",
                        paymentDate: application.feeDetails.paymentDate || application.submittedAt
                    } : {},

                    documents: application.documents,
                    timeline: application.progressTracking?.timeline || []
                }
            };
        } catch (error) {
            logger.error("Error fetching application details", error);
            throw error;
        }
    }

    /**
     * Raise query
     */
    async raiseQuery(applicationId, officerId, data) {
        try {
            const isObjectId = mongoose.Types.ObjectId.isValid(applicationId);
            const appQuery = isObjectId ? { _id: applicationId } : { applicationId };
            const application = await NOCApplication.findOne(appQuery);

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found"
                };
            }

            const ApplicationQuery = require("../../noc/application-query.model");
            const { v4: uuidv4 } = require("uuid");

            const query = new ApplicationQuery({
                queryId: uuidv4(),
                applicationId: application._id,
                raisedBy: officerId,
                raisedByRole: "SGWA",
                subject: data.queryTitle || data.subject,
                query: data.description || data.query,
                priority: data.priority || "MEDIUM",
                status: "OPEN",
                responseDeadline: data.responseDeadline
            });

            await query.save();

            application.status = "QUERY_RAISED_SGWA";
            application.approvalFlow.sgwa.status = "QUERY";
            application.approvalFlow.sgwa.remarks = data.query;
            await application.save({ validateBeforeSave: false });

            await this.sendNotifications(application, "SGWA_QUERY_RAISED", {
                notifyOfficer: true,
                remarks: data.query
            });

            logger.info(`Query raised by SGWA for application ${applicationId}`, { officerId });

            return { application, query };
        } catch (error) {
            logger.error("Error raising query", error);
            throw error;
        }
    }

    /**
     * Get SGWA dashboard statistics
     */
    async getDashboardStats(officerId) {
        try {
            // SGWA sees all applications in DGO-approved or SGWA-review stages
            // For development, we also include SUBMITTED to see data
            const sgwaStatuses = ["SUBMITTED", "APPROVED_DGO", "PENDING_SGWA_REVIEW", "UNDER_REVIEW_SGWA", "QUERY_RAISED_SGWA", "QUERY_RESPONDED"];

            const [
                totalApplications,
                pendingApproval,
                dgoRecommended,
                approved,
                rejected,
                queriesRaised
            ] = await Promise.all([
                NOCApplication.countDocuments({ status: { $in: sgwaStatuses } }),
                NOCApplication.countDocuments({ status: { $in: ["PENDING_SGWA_REVIEW", "UNDER_REVIEW_SGWA", "APPROVED_DGO"] } }),
                NOCApplication.countDocuments({ status: "APPROVED_DGO" }),
                NOCApplication.countDocuments({ status: { $in: ["PENDING_FINAL_APPROVAL", "NOC_ISSUED", "APPROVED_SGWA"] } }),
                NOCApplication.countDocuments({ status: { $in: ["REJECTED_SGWA", "REJECTED"] } }),
                NOCApplication.countDocuments({ status: { $in: ["QUERY_RAISED_SGWA", "QUERY_RAISED_DGO"] } })
            ]);

            // Recent Applications visible to SGWA
            const recentApplications = await NOCApplication.find({ status: { $in: sgwaStatuses } })
                .sort({ submittedAt: -1 })
                .limit(5)
                .lean();

            return {
                stats: {
                    totalApplications,
                    pendingApproval,
                    dgoRecommended,
                    approved,
                    rejected,
                    queriesRaised
                },
                recentApplications: recentApplications,
                alerts: pendingApproval > 0 ? [{
                    id: "alert-1",
                    type: "URGENT",
                    message: `${pendingApproval} applications pending review`,
                    count: pendingApproval
                }] : [],
                upcomingTasks: []
            };
        } catch (error) {
            logger.error("Error fetching SGWA stats", error);
            throw error;
        }
    }


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
            SGWA_APPROVED: "Application Approved by SGWA",
            SGWA_REJECTED: "Application Rejected by SGWA",
            SGWA_QUERY_RAISED: "SGWA Query Raised"
        };
        return titles[event] || "Application Update";
    }

    getNotificationMessage(event, application) {
        const messages = {
            SGWA_APPROVED: `Your NOC application ${application.applicationNumber} has been approved by SGWA and forwarded to Enforcement Wing for final approval.`,
            SGWA_REJECTED: `Your NOC application ${application.applicationNumber} has been rejected by SGWA. Check remarks for details.`,
            SGWA_QUERY_RAISED: `SGWA has raised a query on your application ${application.applicationNumber}. Please respond.`
        };
        return messages[event] || "Your application status has been updated.";
    }
    /**
     * Get Query Details
     */
    async viewQuery(queryId) {
        try {
            const ApplicationQuery = require("../../noc/application-query.model");
            const query = await ApplicationQuery.findOne({ queryId });

            if (!query) {
                throw { statusCode: 404, message: "Query not found" };
            }

            return {
                query: {
                    queryId: query.queryId,
                    applicationId: query.applicationId,
                    queryText: query.description,
                    raisedOn: query.createdAt,
                    status: query.status,
                    response: query.response
                }
            };
        } catch (error) {
            logger.error("Error viewing query", error);
            throw error;
        }
    }

    /**
     * Get Queries List
     */
    async getQueries(officerId, filters = {}) {
        try {
            const ApplicationQuery = require("../../noc/application-query.model");
            const query = { raisedByRole: { $in: ["SGWA", "RSGWA"] } }; // Filter for SGWA and RSGWA queries

            if (filters.status) query.status = filters.status;

            const queries = await ApplicationQuery.find(query)
                .populate("applicationId", "applicationNumber");

            return {
                queries: queries.map(q => ({
                    queryId: q.queryId,
                    applicationId: q.applicationId?._id,
                    applicationNumber: q.applicationId?.applicationNumber,
                    subject: q.subject,
                    raisedBy: q.raisedBy, // populate if needed
                    raisedOn: q.createdAt,
                    dueDate: q.responseDeadline,
                    status: q.status,
                    priority: q.priority
                })),
                pagination: {} // todo
            };
        } catch (error) {
            logger.error("Error fetching queries", error);
            throw error;
        }
    }

    /**
     * Accept Query Response
     */
    async acceptQuery(queryId, officerId, data) {
        try {
            const ApplicationQuery = require("../../noc/application-query.model");
            const query = await ApplicationQuery.findOne({ queryId });

            if (!query) throw { statusCode: 404, message: "Query not found" };

            // Logic to accept response
            query.status = "RESOLVED";
            query.resolutionRemarks = data.remarks;
            query.resolvedAt = new Date();
            query.resolvedBy = officerId;

            await query.save();

            // Update application status if needed
            if (data.moveToStatus) {
                const application = await NOCApplication.findById(query.applicationId);
                if (application) {
                    if (data.moveToStatus === "UNDER_REVIEW") {
                        application.status = "UNDER_REVIEW_SGWA";
                        application.approvalFlow.sgwa.status = "UNDER_REVIEW";
                    }
                    await application.save();
                }
            }

            return { message: "Query response accepted" };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reject Query Response
     */
    async rejectQuery(queryId, officerId, data) {
        try {
            const ApplicationQuery = require("../../noc/application-query.model");
            const query = await ApplicationQuery.findOne({ queryId });
            if (!query) throw { statusCode: 404, message: "Query not found" };

            // Mark currrent query as closed/unresolved or just keep open?
            // Spec says "Raise New Query: true" usually

            query.status = "REJECTED"; // or similar
            await query.save();

            if (data.raiseNewQuery) {
                // Call raiseQuery again
                // const newQueryData = { query: data.newQueryText, ... }
                // await this.raiseQuery(...)
            }

            return { message: "Query response rejected" };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Add Internal Note
     */
    async addInternalNote(applicationId, officerId, data) {
        try {
            const isObjectId = mongoose.Types.ObjectId.isValid(applicationId);
            const query = isObjectId ? { _id: applicationId } : { applicationId };
            const application = await NOCApplication.findOne(query);
            if (!application) throw { statusCode: 404, message: "Application not found" };

            // Ensure notes array exists
            if (!application.internalNotes) application.internalNotes = [];

            application.internalNotes.push({
                noteText: data.noteText,
                addedBy: officerId,
                addedAt: new Date(),
                visibility: data.visibility || "INTERNAL_ONLY",
                taggedOfficers: data.tagOfficers || [],
                attachments: data.attachments || []
            });

            await application.save();
            return { message: "Note added successfully" };
        } catch (error) {
            logger.error("Error adding internal note", error);
            throw error;
        }
    }
}

module.exports = new SGWAService();
