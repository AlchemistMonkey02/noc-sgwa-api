const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const Document = require("../documents/document.model");
const NOCApplication = require("./noc-application.model");
const ApplicationQuery = require("./application-query.model");
const NOCCertificate = require("./noc-certificate.model");
const Payment = require("./payment.model");
const Block = require("../master-data/block.model");
const FeeStructure = require("../master-data/fee-structure.model");
const emailService = require("../utils/email.service");
const notificationService = require("../notifications/notification.service");
const MasterService = require("../master-data/master.service");
const logger = require("../utils/logger");

class NOCService {
    /**
     * Internal helper to find an application and verify access
     * Supports both MongoDB _id and custom applicationId
     */
    async _getAuthorizedApplication(id, userId, userType, populateOptions = null) {
        let queryId = id;

        // Normalize consultation room slugs (e.g., NOC-2026-2602-NOC0001-DGO or REF-20260305-1234-SGWA)
        if (typeof id === 'string') {
            // 1. Remove suffixes (e.g. -DGO, -SGWA, -ENFORCEMENT)
            queryId = id.replace(/-(DGO|SGWA|ENFORCEMENT)$/i, '');
            // 2. If it's an NOC application format with dashes, convert to slashes
            if (queryId.toUpperCase().includes('NOC-')) {
                queryId = queryId.replace(/-/g, '/');
            }
        }

        const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        const query = isObjectId ? { _id: id } : {
            $or: [
                { applicationId: id },
                { applicationId: queryId },
                { applicationNumber: id },
                { applicationNumber: { $regex: new RegExp(`^${queryId}$`, 'i') } },
                { trackingId: id },
                { trackingId: queryId }
            ]
        };

        let queryBuilder = NOCApplication.findOne(query);
        if (populateOptions) {
            queryBuilder = queryBuilder.populate(populateOptions);
        }

        const application = await queryBuilder;

        if (!application) {
            throw {
                statusCode: 404,
                code: "APPLICATION_NOT_FOUND",
                message: "Application not found",
            };
        }

        // Access control: User is owner OR User is an Officer
        const appUserId = application.userId?._id || application.userId;
        const isOwner = appUserId && appUserId.toString() === userId.toString();
        const isOfficer = ["DGO", "SGWA", "RSGWA", "ENFORCEMENT"].includes(userType);

        if (!isOwner && !isOfficer) {
            throw {
                statusCode: 403,
                code: "UNAUTHORIZED_ACCESS",
                message: "You do not have permission to access this application",
            };
        }

        return application;
    }

    /**
     * Create or update draft application
     */
    async createOrUpdateApplication(data, userId) {
        try {
            const applicationId = data.applicationId || uuidv4();

            // Get block category if location is provided
            let block = null;
            if (data.location && data.location.blockId && data.location.districtId) {
                block = await Block.findOne({
                    blockId: data.location.blockId,
                    districtId: data.location.districtId,
                });

                if (!block) {
                    throw {
                        statusCode: 404,
                        code: "BLOCK_NOT_FOUND",
                        message: "Invalid block or district",
                    };
                }
            }

            const applicationData = {
                ...data,
                applicationId,
                userId,
                status: "DRAFT",
            };

            if (data.location) {
                applicationData.location = {
                    ...data.location,
                    blockCategory: block?.category,
                };
            }

            // Generate simple tracking ID if new
            if (!applicationData.trackingId && !data.applicationId) { // Only for new creates
                const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
                const randomPart = Math.floor(1000 + Math.random() * 9000);
                applicationData.trackingId = `REF-${datePart}-${randomPart}`;
            }

            const application = await NOCApplication.findOneAndUpdate(
                { applicationId, userId },
                { $set: applicationData },
                { new: true, upsert: true, runValidators: false }
            );

            logger.info(`Application ${data.applicationId ? "updated" : "created"}: ${applicationId}`, {
                userId,
            });

            return application;
        } catch (error) {
            logger.error("Error creating/updating application", error);
            throw error;
        }
    }

    /**
     * Submit application for review
     */
    async submitApplication(applicationId, userId, userType) {
        try {
            const application = await this._getAuthorizedApplication(applicationId, userId, userType);

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            if (application.status !== "DRAFT") {
                throw {
                    statusCode: 400,
                    code: "INVALID_STATUS",
                    message: "Only draft applications can be submitted",
                };
            }

            // VALIDATE DOCUMENT COMPLETENESS
            const { validateDocumentCompleteness, getDocumentName } = require("./noc-document-validator");

            // Send notification
            const docValidation = await validateDocumentCompleteness(
                application,
                application.userId,
                application.companyId
            );

            // Send notification
            notificationService.send(userId, 'APPLICATION_SUBMITTED', {
                applicationNumber: application.applicationNumber,
                applicationType: application.applicationType,
                projectDetails: application.projectDetails,
                submittedDate: new Date(),
                applicationId: application._id
            });

            /*
            if (!docValidation.isComplete) {
                const missingList = docValidation.missingDocuments
                    .map(doc => `• ${getDocumentName(doc)}`)
                    .join("\n");
    
                throw {
                    statusCode: 400,
                    code: "DOCUMENTS_INCOMPLETE",
                    message: `Cannot submit application. ${docValidation.missingDocuments.length} required document(s) missing.`,
                    details: {
                        completionPercentage: docValidation.completionPercentage,
                        totalRequired: docValidation.totalRequired,
                        totalUploaded: docValidation.totalUploaded,
                        missingDocuments: docValidation.missingDocuments,
                        missingDocumentNames: docValidation.missingDocuments.map(getDocumentName),
                        uploadedDocuments: docValidation.uploadedDocuments,
                    },
                };
            }
            */

            // Calculate fees
            let feeStructure = await FeeStructure.findOne({
                applicationType: application.applicationType,
                blockCategory: application.location.blockCategory,
                isActive: true,
            }).sort({ effectiveFrom: -1 });

            if (!feeStructure) {
                // Fallback: Create a dummy fee structure so execution can proceed
                feeStructure = {
                    baseAmount: 0,
                    ecChargesPerMLD: 0,
                    waterBudgetCharges: 0,
                    processingFee: 0,
                    inspectionFee: 0,
                    calculateTotalFee: () => 0
                };
            }

            const dailyReq = application.waterRequirement?.dailyRequirement || 0;
            const ecCharges = feeStructure.ecChargesPerMLD * dailyReq;
            const totalAmount = feeStructure.calculateTotalFee(dailyReq);

            application.feeDetails = {
                baseAmount: feeStructure.baseAmount,
                ecCharges,
                waterBudgetCharges: feeStructure.waterBudgetCharges,
                processingFee: feeStructure.processingFee,
                inspectionFee: feeStructure.inspectionFee,
                totalAmount,
                isPaid: false,
            };

            application.status = "SUBMITTED";
            application.submittedAt = new Date();

            // Auto-assign to DGO based on district
            await this.assignApplicationToOfficer(application);

            await application.save({ validateBeforeSave: false }); // This will trigger auto-generation of application number

            logger.info(`Application submitted: ${application.applicationNumber}`, { userId });

            // Send multi-channel notifications
            const notificationData = {
                applicationNumber: application.applicationNumber,
                applicationType: application.applicationType,
                projectName: application.projectDetails?.projectName || 'Project',
                submittedDate: application.submittedAt,
                applicationId: application.applicationId
            };

            // 1. Notify Applicant
            notificationService.send(userId, 'APPLICATION_SUBMITTED', notificationData)
                .catch(err => logger.error("Failed to send applicant notification", err));

            // 2. Notify District DGOs
            const district = application.location?.districtId;
            if (district) {
                notificationService.notifyDistrictOfficers(district, 'NEW_APPLICATION_SUBMITTED', {
                    ...notificationData,
                    message: `A new application ${application.applicationNumber} has been submitted in your district.`
                }).catch(err => logger.error("Failed to notify district officers", err));
            }

            return application;
        } catch (error) {
            logger.error("Error submitting application", error);
            throw error;
        }
    }

    /**
     * Auto-assign application to officer based on district
     */
    async assignApplicationToOfficer(application) {
        try {
            const User = require("../auth/user.model");

            // Get district from application
            // Ensure we handle case insensitivity and trimming
            const district = application.location?.districtId?.trim();

            if (!district) {
                logger.warn(`Cannot auto-assign application ${application.applicationId}: No district specified`);
                return;
            }

            // Find DGO for this district
            // We look for a user with role 'DGO' and matching district in communication address
            const officer = await User.findOne({
                userType: "DGO",
                "communicationAddress.district": { $regex: new RegExp(`^${district}$`, "i") }
            });

            if (officer) {
                // Assign to officer
                application.assignedTo = officer._id;
                application.assignedAt = new Date();

                // Update DGO flow
                if (!application.approvalFlow) application.approvalFlow = {};
                if (!application.approvalFlow.dgo) application.approvalFlow.dgo = {};

                application.approvalFlow.dgo.assignedTo = officer._id;
                application.approvalFlow.dgo.assignedAt = new Date();
                application.approvalFlow.dgo.status = "PENDING";

                // Ensure other stages are pending/not started
                // SGWA and Enforcement should NOT be assigned yet
                if (!application.approvalFlow.sgwa) application.approvalFlow.sgwa = { status: "PENDING" };
                if (!application.approvalFlow.enforcement) application.approvalFlow.enforcement = { status: "PENDING" };

                logger.info(`Auto-assigned application ${application.applicationNumber} to DGO ${officer.fullName} (${district})`);

                // TODO: Notify officer (Email/SMS)
            } else {
                logger.warn(`No DGO found for district: ${district}. Application ${application.applicationNumber} remains unassigned.`);
            }
        } catch (error) {
            logger.error("Error in auto-assignment", error);
            // Don't block submission if assignment fails
        }
    }

    /**
     * Get user's applications
     */
    async getUserApplications(userId, filters = {}) {
        try {
            // Handle both ObjectId and string formats for userId robustly
            const query = {
                $or: [
                    { userId: new mongoose.Types.ObjectId(userId) },
                    { userId: userId.toString() }
                ]
            };

            if (filters.status) {
                if (filters.status === 'IN_PROCESS') {
                    // "In Process" means active. User wants to see them even if approved.
                    // We only exclude truly finalized/removed states if any exist.
                    // For now, let's just make it show everything except WITHDRAWN/ARCHIVED
                    query.status = {
                        $nin: ["WITHDRAWN", "ARCHIVED"]
                    };
                } else if (filters.status === 'APPROVED_ALL') {
                    // "Approved All" includes both APPROVED and NOC_ISSUED
                    query.status = {
                        $in: ["APPROVED", "NOC_ISSUED"]
                    };
                } else {
                    query.status = filters.status;
                }
            }

            if (filters.applicationType) {
                query.applicationType = filters.applicationType;
            }

            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const skip = (page - 1) * limit;

            const cursor = await NOCApplication.find(query)
                .select("-documents")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await NOCApplication.countDocuments(query);

            // Enhance applications with stage info and labels
            const enhancedApplications = await Promise.all(cursor.map(async app => {
                const enriched = await MasterService.enrichApplicationLabels(app);
                const { dgo, sgwa, enforcement } = enriched.approvalFlow || {};

                let currentStage = "Submitted";
                if (enriched.status === "DRAFT") currentStage = "Draft";
                else if (dgo?.status === "PENDING") currentStage = "DGO Review";
                else if (sgwa?.status === "PENDING") currentStage = "SGWA Review";
                else if (enforcement?.status === "PENDING") currentStage = "Enforcement";
                else if (enriched.status === "APPROVED" || enriched.status === "NOC_ISSUED") currentStage = "Completed";

                return {
                    ...enriched,
                    currentStage,
                    projectName: enriched.projectDetails?.projectName || "N/A"
                };
            }));

            return {
                applications: enhancedApplications,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error("Error fetching user applications", error);
            throw error;
        }
    }

    /**
     * Get application by ID
     */
    async getApplicationById(applicationId, userId, userType) {
        try {
            const application = await this._getAuthorizedApplication(
                applicationId,
                userId,
                userType,
                "nocCertificateId"
            );
            return await MasterService.enrichApplicationLabels(application);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Withdraw application
     */
    async withdrawApplication(applicationId, userId, userType) {
        try {
            const application = await this._getAuthorizedApplication(applicationId, userId, userType);

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            if (["APPROVED", "REJECTED", "NOC_ISSUED", "WITHDRAWN"].includes(application.status)) {
                throw {
                    statusCode: 400,
                    code: "CANNOT_WITHDRAW",
                    message: "Application cannot be withdrawn in current status",
                };
            }

            application.status = "WITHDRAWN";
            await application.save();

            logger.info(`Application withdrawn: ${application.applicationNumber}`, { userId });

            return application;
        } catch (error) {
            logger.error("Error withdrawing application", error);
            throw error;
        }
    }

    /**
     * Get application queries
     */
    async getApplicationQueries(applicationId) {
        try {
            // Resolve application first to handle both _id and custom applicationId
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(applicationId);
            let appQuery = isObjectId ? { _id: applicationId } : { applicationId };

            const application = await NOCApplication.findOne(appQuery);
            if (!application) {
                return [];
            }

            const queries = await ApplicationQuery.find({ applicationId: application._id })
                .populate("raisedBy", "firstName lastName userType")
                .populate("respondedBy", "firstName lastName")
                .sort({ raisedAt: -1 });

            return queries;
        } catch (error) {
            logger.error("Error fetching application queries", error);
            throw error;
        }
    }

    /**
     * Respond to query
     */
    async respondToQuery(queryId, response, userId) {
        try {
            const query = await ApplicationQuery.findOne({ queryId });

            if (!query) {
                throw {
                    statusCode: 404,
                    code: "QUERY_NOT_FOUND",
                    message: "Query not found",
                };
            }

            if (query.status !== "OPEN") {
                throw {
                    statusCode: 400,
                    code: "QUERY_ALREADY_RESPONDED",
                    message: "Query has already been responded to",
                };
            }

            query.response = response;
            query.respondedBy = userId;
            query.respondedAt = new Date();
            query.status = "RESPONDED";
            await query.save();

            // Update application status
            const application = await NOCApplication.findById(query.applicationId);
            if (application && application.status === "QUERY_RAISED") {
                application.status = "QUERY_RESPONDED";
                await application.save();

                // Notify officer who raised the query
                notificationService.send(query.raisedBy, 'QUERY_RESPONDED', {
                    applicationNumber: application.applicationNumber,
                    projectName: application.projectDetails?.projectName,
                    remarks: response
                }).catch(err => logger.error("Failed to notify officer of query response", err));
            }

            logger.info(`Query responded: ${queryId}`, { userId });

            return query;
        } catch (error) {
            logger.error("Error responding to query", error);
            throw error;
        }
    }

    /**
     * Track application (public)
     */
    async trackApplication(applicationNumberOrId) {
        try {
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(applicationNumberOrId);
            const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i.test(applicationNumberOrId);
            
            const query = isObjectId ? { _id: applicationNumberOrId } : {
                $or: [
                    { applicationNumber: applicationNumberOrId },
                    { trackingId: applicationNumberOrId },
                    { applicationId: applicationNumberOrId }
                ]
            };

            const application = await NOCApplication.findOne(query)
                .populate("userId", "firstName lastName")
                .select(
                    "applicationNumber applicationType status submittedAt approvalFlow rejectionReason createdAt projectDetails location trackingId applicationId"
                );

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            // Define Tracking Steps
            const steps = [
                {
                    id: 1,
                    title: "Application Created",
                    status: "COMPLETED",
                    date: application.createdAt,
                    description: "Application drafted successfully."
                },
                {
                    id: 2,
                    title: "Document Verification",
                    status: "PENDING",
                    description: "Waiting for document verification."
                },
                {
                    id: 3,
                    title: "Waiting for DGO Approval",
                    status: "PENDING",
                    description: "Pending review by District Ground Water Officer."
                },
                {
                    id: 4,
                    title: "Waiting for SGWA Approval",
                    status: "PENDING",
                    description: "Pending review by State Ground Water Authority."
                },
                {
                    id: 5,
                    title: "Waiting for Enforcement Wing Approval",
                    status: "PENDING",
                    description: "Pending final compliance check."
                },
                {
                    id: 6,
                    title: "NOC Issued",
                    status: "PENDING",
                    description: "Final certificate issuance."
                }
            ];

            const { dgo, sgwa, enforcement } = application.approvalFlow || {};

            // 1. Application Created (Already Set)

            // 2. Document Verification
            if (dgo?.documentsVerified) {
                steps[1].status = "COMPLETED";
                steps[1].date = dgo.assignedAt || application.submittedAt; // Approx
                steps[1].description = "Documents verified successfully.";
            } else if (application.status !== "DRAFT") {
                steps[1].status = "IN_PROGRESS";
                steps[1].description = "Verification in progress.";
            }

            // 3. DGO Approval
            if (steps[1].status === "COMPLETED") {
                if (dgo?.status === "APPROVED") {
                    steps[2].status = "COMPLETED";
                    steps[2].date = dgo.reviewedAt;
                    steps[2].description = "Approved by DGO.";
                } else if (dgo?.status === "REJECTED") {
                    steps[2].status = "REJECTED";
                    steps[2].date = dgo.reviewedAt;
                    steps[2].description = `Rejected by DGO: ${dgo.remarks || "Criteria not met"}`;
                    // Fail subsequent steps
                    steps[3].status = "SKIPPED";
                    steps[4].status = "SKIPPED";
                    steps[5].status = "SKIPPED";
                } else {
                    steps[2].status = "IN_PROGRESS";
                }
            }

            // 4. SGWA Approval
            if (steps[2].status === "COMPLETED") {
                if (sgwa?.status === "APPROVED") {
                    steps[3].status = "COMPLETED";
                    steps[3].date = sgwa.reviewedAt;
                    steps[3].description = "Approved by SGWA.";
                } else if (sgwa?.status === "REJECTED") {
                    steps[3].status = "REJECTED";
                    steps[3].date = sgwa.reviewedAt;
                    steps[3].description = `Rejected by SGWA: ${sgwa.remarks}`;
                    steps[4].status = "SKIPPED";
                    steps[5].status = "SKIPPED";
                } else {
                    steps[3].status = "IN_PROGRESS";
                }
            }

            // 5. Enforcement Approval
            if (steps[3].status === "COMPLETED") {
                if (enforcement?.status === "APPROVED") {
                    steps[4].status = "COMPLETED";
                    steps[4].date = enforcement.reviewedAt;
                    steps[4].description = "Approved by Enforcement Wing.";
                } else if (enforcement?.status === "REJECTED") {
                    steps[4].status = "REJECTED";
                    steps[4].date = enforcement.reviewedAt;
                    steps[4].description = `Rejected by Enforcement: ${enforcement.remarks}`;
                    steps[5].status = "SKIPPED";
                } else {
                    steps[4].status = "IN_PROGRESS";
                }
            }

            // 6. NOC Issued
            if (steps[4].status === "COMPLETED") {
                if (application.status === "NOC_ISSUED") {
                    steps[5].status = "COMPLETED";
                    steps[5].date = application.updatedAt;
                    steps[5].description = `NOC Issued. Certificate generated.`;
                } else {
                    steps[5].status = "IN_PROGRESS";
                    steps[5].description = "Generating certificate...";
                }
            }

            // Handle Global Rejection if not captured in flow
            if (application.status?.includes("REJECTED") && !steps.some(s => s.status === "REJECTED")) {
                // Find the last in-progress or pending step and mark rejected
                const lastActiveIndex = steps.findIndex(s => s.status === "IN_PROGRESS" || s.status === "PENDING");
                if (lastActiveIndex !== -1) {
                    steps[lastActiveIndex].status = "REJECTED";
                    steps[lastActiveIndex].description = `Application Rejected: ${application.rejectionReason || "Unknown Reason"}`;
                }
            }

            // Determine current pending location
            let pendingWith = "Pending Processing";
            if (application.status === "DRAFT") pendingWith = "Draft (Unsubmitted)";
            else if (application.status === "SUBMITTED") pendingWith = "Document Verification";
            else if (dgo?.status === "PENDING") pendingWith = "District Officer (DGO)";
            else if (sgwa?.status === "PENDING") pendingWith = "State Authority (SGWA)";
            else if (enforcement?.status === "PENDING") pendingWith = "Enforcement Wing";
            else if (application.status === "APPROVED") pendingWith = "Final Issuance";
            else if (application.status === "NOC_ISSUED") pendingWith = "Completed";

            // Enrich tracking response
            const enrichedTracked = await MasterService.enrichApplicationLabels(application);

            return {
                applicationId: application._id,
                applicationNumber: application.applicationNumber,
                trackingId: application.trackingId,
                status: application.status,
                projectName: application.projectDetails?.projectName || "N/A",
                applicantDetails: {
                    name: application.userId ? `${application.userId.firstName} ${application.userId.lastName}` : "Applicant"
                },
                applicationType: enrichedTracked.applicationTypeLabel || application.applicationType || "NOC",
                applicationTypeLabel: enrichedTracked.applicationTypeLabel,
                applicationSubTypeLabel: enrichedTracked.applicationSubTypeLabel,
                submittedDate: application.submittedAt || application.createdAt,
                pendingWith: pendingWith,
                currentLocation: pendingWith,
                remarks: application.rejectionReason,
                timeline: steps, // Match frontend expectation
                trackingSteps: steps, // Keep for compatibility
                stages: steps.map(s => ({
                    ...s,
                    label: s.title,
                    date: s.date ? new Date(s.date).toLocaleDateString() : 'Pending'
                }))
            };
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // SECTION-WISE UPDATE METHODS (CGWA 8-Section Workflow)
    // ============================================

    async updateSection1(appId, data, userId, userType) { return this.updateSection(appId, 1, data, userId, userType); }
    async updateSection2(appId, data, userId, userType) { return this.updateSection(appId, 2, data, userId, userType); }
    async updateSection3(appId, data, userId, userType) { return this.updateSection(appId, 3, data, userId, userType); }
    async updateSection4(appId, data, userId, userType) { return this.updateSection(appId, 4, data, userId, userType); }
    async updateSection5(appId, data, userId, userType) { return this.updateSection(appId, 5, data, userId, userType); }
    async updateSection6(appId, data, userId, userType) { return this.updateSection(appId, 6, data, userId, userType); }
    async updateSection7(appId, data, userId, userType) { return this.updateSection(appId, 7, data, userId, userType); }

    // ============================================

    /**
     * Update specific section of an application
     */
    async updateSection(applicationId, sectionNumber, sectionData, userId, userType) {
        try {
            const application = await this._getAuthorizedApplication(applicationId, userId, userType);

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            if (application.status !== "DRAFT") {
                throw {
                    statusCode: 400,
                    code: "INVALID_STATUS",
                    message: "Can only update draft applications",
                };
            }

            // Update section based on section number
            switch (sectionNumber) {
                case 1: // Basic Details
                    // Top level fields
                    if (sectionData.applicationCategory) application.applicationCategory = sectionData.applicationCategory;
                    if (sectionData.applicationType) application.applicationType = sectionData.applicationType;
                    if (sectionData.applicationSubType) application.applicationSubType = sectionData.applicationSubType;
                    if (sectionData.projectType) application.projectType = sectionData.projectType;
                    if (sectionData.waterQualityType) application.waterQualityType = sectionData.waterQualityType;
                    if (sectionData.groundWaterUtilizationFor) application.groundWaterUtilizationFor = sectionData.groundWaterUtilizationFor;
                    if (sectionData.dateOfCommencement) application.dateOfCommencement = sectionData.dateOfCommencement;
                    if (sectionData.existingNOCStatus) application.existingNOCStatus = sectionData.existingNOCStatus;
                    if (sectionData.oldNOCNumber) application.oldNOCNumber = sectionData.oldNOCNumber;
                    if (sectionData.projectCategory) application.projectCategory = sectionData.projectCategory;
                    if (sectionData.sectorType) application.sectorType = sectionData.sectorType;
                    if (sectionData.validityPeriodRequested) application.validityPeriodRequested = sectionData.validityPeriodRequested;

                    // Nested Objects
                    if (sectionData.projectDetails) {
                        application.projectDetails = {
                            ...(application.projectDetails || {}),
                            ...sectionData.projectDetails
                        };
                    }

                    if (sectionData.communicationAddress) {
                        application.communicationAddress = {
                            ...(application.communicationAddress || {}),
                            ...sectionData.communicationAddress
                        };
                    }
                    
                    if (application.sectionCompletionStatus) {
                        application.sectionCompletionStatus.section1BasicDetails = true;
                    }
                    break;

                case 2: // Location Details
                    if (sectionData.location) {
                        // Get block category for the selected block
                        const block = await Block.findOne({
                            blockId: sectionData.location.blockId,
                            districtId: sectionData.location.districtId,
                        });

                        application.location = {
                            ...(application.location || {}),
                            ...sectionData.location,
                            blockCategory: block?.category || sectionData.location.blockCategory || application.location?.blockCategory
                        };
                    }

                    // Update land area details
                    if (sectionData.projectDetails) {
                        application.projectDetails = {
                            ...(application.projectDetails || {}),
                            ...sectionData.projectDetails
                        };
                    }

                    // Update Hydrogeology Details (e.g., Aquifer Type) if provided
                    if (sectionData.hydrogeology) {
                        application.hydrogeology = {
                            ...(application.hydrogeology || {}),
                            ...sectionData.hydrogeology
                        };
                    }

                    // Sync top level if necessary
                    if (sectionData.waterQualityType) application.waterQualityType = sectionData.waterQualityType;
                    if (sectionData.projectType) application.projectType = sectionData.projectType;
                    
                    if (application.sectionCompletionStatus) {
                        application.sectionCompletionStatus.section2LocationDetails = true;
                    }
                    break;

                case 3: // Drinking & Domestic Use
                    if (sectionData.drinkingDomesticUse) {
                        const { numberOfWorkers = 0, numberOfResidents = 0, dailyRequirementPerPerson = 135 } = sectionData.drinkingDomesticUse;
                        
                        // CGWA Standard Calculation: 45L for Workers, User Defined (Default 135L) for Residents
                        const totalDailyDomestic = ((numberOfWorkers * 45) + (numberOfResidents * dailyRequirementPerPerson)) / 1000;
                        
                        application.drinkingDomesticUse = {
                            ...(application.drinkingDomesticUse || {}),
                            ...sectionData.drinkingDomesticUse,
                            totalDailyDomestic,
                            totalAnnualDomestic: totalDailyDomestic * 365,
                            totalRequirement: totalDailyDomestic
                        };
                    }

                    if (sectionData.waterRequirement) {
                        application.waterRequirement = {
                            ...(application.waterRequirement || {}),
                            ...sectionData.waterRequirement
                        };
                    }
                    
                    if (application.sectionCompletionStatus) {
                        application.sectionCompletionStatus.section3DrinkingDomestic = true;
                    }
                    break;

                case 4: // Water Requirement Breakup
                    if (sectionData.waterRequirementBreakup) {
                        application.waterRequirementBreakup = sectionData.waterRequirementBreakup;
                    }

                    if (sectionData.stpEtpDetails) {
                        application.stpEtpDetails = {
                            ...(application.stpEtpDetails || {}),
                            ...sectionData.stpEtpDetails
                        };
                    }

                    if (sectionData.waterRequirement) {
                        application.waterRequirement = {
                            ...(application.waterRequirement || {}),
                            ...sectionData.waterRequirement
                        };
                    }
                    
                    if (application.sectionCompletionStatus) {
                        application.sectionCompletionStatus.section4WaterBreakup = true;
                    }
                    break;

                case 5: // Ground Water Structures
                    if (sectionData.groundWaterStructures) {
                        application.groundWaterStructures = sectionData.groundWaterStructures;
                    }
                    if (sectionData.hydrogeology) {
                        application.hydrogeology = {
                            ...(application.hydrogeology || {}),
                            ...sectionData.hydrogeology
                        };
                    }
                    if (sectionData.waterRequirement?.proposedExtraction) {
                        application.waterRequirement = {
                            ...(application.waterRequirement || {}),
                            proposedExtraction: {
                                ...(application.waterRequirement?.proposedExtraction || {}),
                                ...sectionData.waterRequirement.proposedExtraction
                            }
                        };
                    }
                    
                    if (application.sectionCompletionStatus) {
                        application.sectionCompletionStatus.section5GroundWaterStructures = true;
                    }
                    break;

                case 6: // Document Attachments
                    if (sectionData.documents && Array.isArray(sectionData.documents)) {
                        application.documents = sectionData.documents;
                    }
                    if (sectionData.documentsReviewed !== undefined) {
                        application.documentsReviewed = sectionData.documentsReviewed;
                    }
                    
                    if (application.sectionCompletionStatus) {
                        application.sectionCompletionStatus.section6Attachments = true;
                    }
                    break;

                case 7: // Fee Calculation / GW Charges
                    if (sectionData.feeDetails) {
                        application.feeDetails = {
                            ...(application.feeDetails || {}),
                            ...sectionData.feeDetails
                        };
                    }
                    
                    if (application.sectionCompletionStatus) {
                        application.sectionCompletionStatus.section7GWCharges = true;
                    }
                    break;

                case 8: // Final Summary / Undertakings
                    if (sectionData.undertakings) {
                        application.undertakings = {
                            ...(application.undertakings || {}),
                            ...sectionData.undertakings
                        };
                    }
                    
                    if (application.sectionCompletionStatus) {
                        application.sectionCompletionStatus.section8Summary = true;
                    }
                    break;

                case 9: // Digital Flow Meter
                    if (sectionData.digitalFlowMeter) {
                        application.digitalFlowMeter = {
                            ...(application.digitalFlowMeter || {}),
                            ...sectionData.digitalFlowMeter,
                            telemetry: {
                                ...(application.digitalFlowMeter?.telemetry || {}),
                                ...(sectionData.digitalFlowMeter.telemetry || {})
                            },
                            complianceCommitments: {
                                ...(application.digitalFlowMeter?.complianceCommitments || {}),
                                ...(sectionData.digitalFlowMeter.complianceCommitments || {})
                            }
                        };
                    }
                    break;

                default:
                    throw {
                        statusCode: 400,
                        code: "INVALID_SECTION",
                        message: `Invalid section number: ${sectionNumber}. Supported sections: 1-9.`,
                    };
            }


            await application.save({ validateBeforeSave: false });
            logger.info(`Application section ${sectionNumber} updated: ${applicationId}`, { userId });
            return application;
        } catch (error) {
            logger.error(`Error updating section ${sectionNumber}`, error);
            throw error;
        }
    }

    /**
     * Calculate application fees
     */
    async calculateApplicationFees(applicationId, userId, userType) {
        try {
            const application = await this._getAuthorizedApplication(applicationId, userId, userType);

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            const baseFee = 1000;

            // Reconstruct Domestic Total if missing
            let domesticTotal = application.drinkingDomesticUse?.totalRequirement || 0;
            if (domesticTotal === 0 && application.drinkingDomesticUse) {
                const residents = application.drinkingDomesticUse.numberOfResidents || 0;
                const workers = application.drinkingDomesticUse.numberOfWorkers || 0;
                const dailyReq = application.drinkingDomesticUse.dailyRequirementPerPerson || 135;
                // Convert Liters to Cubic Meters (1 m3 = 1000 L)
                domesticTotal = ((residents * dailyReq) + (workers * 45)) / 1000;
            }

            const waterReqData = application.waterRequirement?.totalRequirement !== undefined
                ? application.waterRequirement.totalRequirement
                : domesticTotal;

            const waterRequirement = waterReqData;
            const ratePerCubicMeter = 10;
            const abstractionCharge = waterRequirement * ratePerCubicMeter * 365;
            const subtotal = baseFee + abstractionCharge;
            const gst = subtotal * 0.18;

            return {
                feeCalculation: {
                    baseFee,
                    abstractionCharge,
                    waterRequirement,
                    gstRate: 18,
                    gstAmount: gst,
                    totalAmount: subtotal + gst
                }
            };
        } catch (error) {
            logger.error("Error calculating fees", error);
            throw error;
        }
    }

    async getApplicationSummary(applicationId, userId, userType) {
        try {
            // Ensure models required for population are registered
            require('../auth/user.model');
            require('../company/company.model');

            const application = await this._getAuthorizedApplication(
                applicationId,
                userId,
                userType,
                [
                    { path: 'companyId', select: 'companyName registrationNumber gstNumber' },
                    { path: 'userId', select: 'firstName lastName email phone' }
                ]
            );

            // Fetch Application Type Name
            let applicationTypeName = "";
            try {
                const mongoose = require("mongoose");
                const ApplicationType = mongoose.models.ApplicationType || mongoose.model('ApplicationType', new mongoose.Schema({ id: Number, name: String, isActive: Boolean }), 'applicationtypes');

                if (application.applicationType) {
                    const typeId = parseInt(application.applicationType);
                    if (!isNaN(typeId)) {
                        const typeObj = await ApplicationType.findOne({ id: typeId }).select("name");
                        if (typeObj) {
                            applicationTypeName = typeObj.name;
                        }
                    }
                }
            } catch (err) {
                logger.warn("Failed to fetch application type name for summary", err);
            }

            // Calculate fees only if needed or just use current structure
            // Using existing method but handling potential errors gracefully
            let fees = {};
            try {
                // Fee calculation might fail if data is incomplete, which is fine for summary
                // We can just return basic fee info or specific fee details if they exist
                if (application.feeDetails && application.feeDetails.totalAmount > 0) {
                    fees = application.feeDetails;
                } else {
                    const feeCalc = await this.calculateApplicationFees(applicationId, userId, userType);
                    fees = feeCalc.feeCalculation;
                }
            } catch (err) {
                logger.warn(`Failed to calculate fees for application summary: ${applicationId}`, err);
            }

            return {
                applicationId: application.applicationId,
                applicationNumber: application.applicationNumber,
                trackingId: application.trackingId,
                status: application.status,
                rejectionReason: application.rejectionReason,
                approvalFlow: application.approvalFlow,
                basicDetails: {
                    applicationType: application.applicationType,
                    applicationTypeName: applicationTypeName, // Added Name
                    sectorType: application.sectorType,
                    projectDetails: application.projectDetails
                },
                locationDetails: application.location,
                drinkingDomesticUse: application.drinkingDomesticUse,
                waterRequirementBreakup: application.waterRequirementBreakup,
                waterRequirement: application.waterRequirement,
                groundWaterStructures: application.groundWaterStructures,
                digitalFlowMeter: application.digitalFlowMeter,
                documents: application.documents,
                feeDetails: fees,
                submittedAt: application.submittedAt,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt,
                companyDetails: application.companyId
            };
        } catch (error) {
            logger.error("Error fetching application summary", error);
            throw error;
        }
    }

    /**
     * Get section completion status
     */
    async getSectionCompletionStatus(applicationId, userId, userType) {
        try {
            const application = await this._getAuthorizedApplication(applicationId, userId, userType);

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            const sections = {
                section1: {
                    name: "Basic Details",
                    isComplete: !!(application.applicationType && application.sectorType)
                },
                section2: {
                    name: "Location Details",
                    isComplete: !!(application.location?.blockId)
                },
                section3: {
                    name: "Drinking & Domestic Use",
                    isComplete: !!(application.drinkingDomesticUse?.numberOfWorkers >= 0)
                },
                section4: {
                    name: "Water Requirement Breakup",
                    isComplete: !!(application.waterRequirementBreakup?.length > 0)
                },
                section5: {
                    name: "Ground Water Structures",
                    isComplete: !!(application.groundWaterStructures?.length > 0)
                },
                section6: {
                    name: "Document Attachments",
                    isComplete: application.documentsReviewed || false
                }
            };

            const completedCount = Object.values(sections).filter(s => s.isComplete).length;

            return {
                sections,
                overview: {
                    completedSections: completedCount,
                    totalSections: 6,
                    completionPercentage: Math.round((completedCount / 6) * 100)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Validate specific section
     */
    async validateSection(applicationId, sectionNumber, userId, userType) {
        try {
            const application = await this._getAuthorizedApplication(applicationId, userId, userType);

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            const errors = [];

            switch (sectionNumber) {
                case 1:
                    if (!application.applicationType) errors.push("Application type is required");
                    if (!application.sectorType) errors.push("Sector type is required");
                    break;
                case 2:
                    if (!application.location?.blockId) errors.push("Block is required");
                    break;
                case 3:
                    if (application.drinkingDomesticUse?.numberOfWorkers === undefined) errors.push("Number of workers is required");
                    break;
                case 4:
                    if (!application.waterRequirementBreakup || application.waterRequirementBreakup.length === 0) {
                        errors.push("At least one activity is required");
                    }
                    break;
                case 5:
                    if (!application.groundWaterStructures || application.groundWaterStructures.length === 0) {
                        errors.push("At least one structure is required");
                    }
                    break;
                case 6:
                    if (!application.documentsReviewed) errors.push("Documents must be reviewed");
                    break;
            }

            return {
                sectionNumber,
                isValid: errors.length === 0,
                errors
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get application progress
     */
    async getApplicationProgress(applicationId, userId, userType) {
        try {
            const application = await this._getAuthorizedApplication(applicationId, userId, userType);

            const sectionStatus = await this.getSectionCompletionStatus(applicationId, userId, userType);

            return {
                applicationId,
                currentStatus: application.status,
                sectionProgress: sectionStatus.overview,
                sections: sectionStatus.sections,
                canSubmit: sectionStatus.overview.completionPercentage === 100
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get application timeline
     */
    /**
     * Get application timeline
     */
    async getApplicationTimeline(applicationId, userId, userType) {
        try {
            const application = await this._getAuthorizedApplication(
                applicationId,
                userId,
                userType,
                [
                    { path: "approvalFlow.dgo.reviewedBy", select: "firstName lastName role" },
                    { path: "approvalFlow.sgwa.reviewedBy", select: "firstName lastName role" },
                    { path: "approvalFlow.enforcement.reviewedBy", select: "firstName lastName role" },
                    { path: "approvalFlow.dgo.assignedTo", select: "firstName lastName role" },
                    { path: "userId", select: "firstName lastName" }
                ]
            );

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            const timeline = [];

            // 1. Created
            timeline.push({
                event: "APPLICATION_CREATED",
                timestamp: application.createdAt,
                user: "System",
                description: "Application draft created",
                icon: "📝"
            });

            // 2. Submitted
            if (application.submittedAt) {
                timeline.push({
                    event: "APPLICATION_SUBMITTED",
                    timestamp: application.submittedAt,
                    user: `${application.userId.firstName} ${application.userId.lastName}`,
                    description: "Application submitted for review",
                    icon: "🚀"
                });
            }

            const { dgo, sgwa, enforcement } = application.approvalFlow || {};

            // 3. DGO Events
            if (dgo) {
                if (dgo.assignedAt) {
                    timeline.push({
                        event: "DGO_ASSIGNED",
                        timestamp: dgo.assignedAt,
                        user: "System",
                        description: dgo.assignedTo ? `Assigned to DGO: ${dgo.assignedTo.firstName}` : "Assigned to District Officer",
                        icon: "👤"
                    });
                }
                if (dgo.reviewedAt) {
                    const statusText = dgo.status === "APPROVED" ? "Approved" : dgo.status === "REJECTED" ? "Rejected" : "Reviewed";
                    timeline.push({
                        event: `DGO_${dgo.status}`,
                        timestamp: dgo.reviewedAt,
                        user: dgo.reviewedBy ? `${dgo.reviewedBy.firstName}` : "District Officer",
                        description: `DGO Recommendation: ${statusText}. Remarks: ${dgo.remarks || "None"}`,
                        icon: dgo.status === "APPROVED" ? "✅" : "⚠️"
                    });
                }
                if (dgo.status === "QUERY") {
                    timeline.push({
                        event: "DGO_QUERY",
                        timestamp: dgo.reviewedAt, // Using reviewedAt as query time
                        user: "District Officer",
                        description: `Query Raised: ${dgo.remarks}`,
                        icon: "❓"
                    });
                }
                // Documents Verification
                if (dgo.documentsVerified) {
                    // Approximate time if not stored explicitly, or use reviewedAt if available
                    timeline.push({
                        event: "DOCUMENTS_VERIFIED",
                        timestamp: dgo.reviewedAt || new Date(),
                        user: "District Officer",
                        description: "Documents verified by DGO",
                        icon: "📑"
                    });
                }
            }

            // 4. Inspection Events
            if (application.status === "INSPECTION_SCHEDULED" && dgo?.inspectionScheduledAt) {
                timeline.push({
                    event: "INSPECTION_SCHEDULED",
                    timestamp: dgo.inspectionScheduledAt,
                    user: "District Officer",
                    description: `Inspection Scheduled.`,
                    icon: "📅"
                });
            }
            if (dgo?.inspectionDetails?.submittedAt) {
                timeline.push({
                    event: "INSPECTION_COMPLETED",
                    timestamp: dgo.inspectionDetails.submittedAt,
                    user: "Inspection Officer",
                    description: "Site Inspection Completed",
                    icon: "🔍"
                });
            }

            // 5. SGWA Events
            if (sgwa) {
                if (sgwa.assignedAt) {
                    timeline.push({
                        event: "SGWA_ASSIGNED",
                        timestamp: sgwa.assignedAt,
                        user: "System",
                        description: "Forwarded to SGWA for Technical Review",
                        icon: "➡️"
                    });
                }
                if (sgwa.reviewedAt) {
                    const statusText = sgwa.status === "APPROVED" ? "Approved" : sgwa.status === "REJECTED" ? "Rejected" : "Reviewed";
                    timeline.push({
                        event: `SGWA_${sgwa.status}`,
                        timestamp: sgwa.reviewedAt,
                        user: sgwa.reviewedBy ? `${sgwa.reviewedBy.firstName}` : "State Officer",
                        description: `SGWA Decision: ${statusText}. ${sgwa.remarks || ""}`,
                        icon: sgwa.status === "APPROVED" ? "🏛️" : "⚠️"
                    });
                }
            }

            // 6. NOC Issued / Final Status
            if (application.status === "NOC_ISSUED") {
                timeline.push({
                    event: "NOC_ISSUED",
                    timestamp: application.updatedAt,
                    user: "Authority",
                    description: "NOC Certificate Issued",
                    icon: "🎉"
                });
            } else if (application.status.includes("REJECTED")) {
                timeline.push({
                    event: "APPLICATION_REJECTED",
                    timestamp: application.updatedAt,
                    user: "Authority",
                    description: `Application Rejected. Reason: ${application.rejectionReason || "Criteria not met"}`,
                    icon: "❌"
                });
            }

            // Sort by timestamp descending
            return {
                applicationId,
                timeline: timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get approval flow status only
     */
    async getApprovalFlow(applicationId, userId, userType) {
        try {
            const application = await this._getAuthorizedApplication(
                applicationId,
                userId,
                userType,
                [
                    { path: "approvalFlow.dgo.reviewedBy", select: "firstName lastName" },
                    { path: "approvalFlow.sgwa.reviewedBy", select: "firstName lastName" },
                    { path: "approvalFlow.enforcement.reviewedBy", select: "firstName lastName" }
                ]
            );

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            const { dgo, sgwa, enforcement } = application.approvalFlow || {};

            return {
                applicationId: application.applicationId,
                applicationNumber: application.applicationNumber,
                currentStatus: application.status,
                approvalFlow: {
                    dgo: {
                        status: dgo?.status || "PENDING",
                        reviewedBy: dgo?.reviewedBy ? `${dgo.reviewedBy.firstName} ${dgo.reviewedBy.lastName}` : null,
                        reviewedAt: dgo?.reviewedAt,
                        remarks: dgo?.remarks,
                        documentsVerified: dgo?.documentsVerified || false
                    },
                    sgwa: {
                        status: sgwa?.status || "PENDING",
                        reviewedBy: sgwa?.reviewedBy ? `${sgwa.reviewedBy.firstName} ${sgwa.reviewedBy.lastName}` : null,
                        reviewedAt: sgwa?.reviewedAt,
                        remarks: sgwa?.remarks,
                        recommendation: sgwa?.recommendation
                    },
                    enforcement: {
                        status: enforcement?.status || "PENDING",
                        reviewedBy: enforcement?.reviewedBy ? `${enforcement.reviewedBy.firstName} ${enforcement.reviewedBy.lastName}` : null,
                        reviewedAt: enforcement?.reviewedAt,
                        remarks: enforcement?.remarks,
                        nocNumber: enforcement?.nocNumber,
                        nocIssuedAt: enforcement?.nocIssuedAt
                    }
                }
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Link documents to application
     */
    async linkDocuments(applicationId, documentIds, userId) {
        try {
            const application = await NOCApplication.findOne({ applicationId, userId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            // Fetch actual document details from Document collection
            const documents = await Document.find({ documentId: { $in: documentIds } });

            if (documents.length === 0) {
                throw {
                    statusCode: 404,
                    code: "DOCUMENTS_NOT_FOUND",
                    message: "No valid documents found for the provided IDs",
                };
            }

            // Map to embedded schema format
            const timestamp = new Date();
            const embeddedDocs = documents.map(doc => ({
                documentType: doc.documentType || "OTHER",
                documentId: doc.documentId,
                fileName: doc.originalFilename || doc.documentName,
                uploadedAt: doc.uploadedAt || timestamp,
                isVerified: false,
                verification: {
                    dgo: { status: 'PENDING', verified: false },
                    sgwa: { status: 'PENDING', verified: false },
                    enforcement: { status: 'PENDING', verified: false }
                }
            }));

            // Check if documents already exist to avoid duplicates (optional, but good practice)
            // For now, simpler to just push or replace. Let's merge.

            // Filter out ones that are already linked
            const existingIds = (application.documents || []).map(d => d.documentId);
            const newDocs = embeddedDocs.filter(d => !existingIds.includes(d.documentId));

            if (newDocs.length > 0) {
                application.documents = [...(application.documents || []), ...newDocs];
                await application.save();
            }

            logger.info(`Documents linked: ${applicationId}`, { userId, count: newDocs.length });
            return application;
        } catch (error) {
            logger.error("Error linking documents", error);
            throw error;
        }
    }

    /**
     * Get application documents
     */
    async getApplicationDocuments(applicationId, user) {
        try {
            const userId = user.id || user._id;
            const userType = user.userType || user.role;

            // Check if applicationId is a valid MongoDB ObjectId
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(applicationId);

            const query = {};
            if (isObjectId) {
                query._id = applicationId;
            } else {
                query.applicationId = applicationId;
            }

            const authorizedRoles = ["DGO", "SGWA", "RSGWA", "ENFORCEMENT", "ADMIN"];
            if (authorizedRoles.indexOf(userType) === -1) {
                query.userId = userId;
            } else if (userType !== 'ADMIN') {
                // Strict Officer Isolation: Must be assigned OR same district (DGO)
                const officerQuery = [
                    { assignedTo: userId },
                    { "location.districtId": user.districtId }
                ];
                if (query.$or) {
                    query.$and = [{ $or: query.$or }, { $or: officerQuery }];
                    delete query.$or;
                } else {
                    query.$or = officerQuery;
                }
            }

            const application = await NOCApplication.findOne(query);

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found or you do not have permission to view it",
                };
            }

            // Return the embedded documents array which contains application-specific statuses
            return application.documents || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Save Payment Details (Section 8)
     */
    async savePaymentDetails(applicationId, data, userId) {
        try {
            const application = await this.getAccessibleApplication(applicationId, userId);

            // Update Fee and Payment Details
            if (data.feeDetails) {
                application.feeDetails = {
                    ...application.feeDetails,
                    ...data.feeDetails,
                    isPaid: data.feeDetails.isPaid !== undefined ? data.feeDetails.isPaid : true
                };
            }
            if (data.feeStructure) {
                application.feeStructure = data.feeStructure;
            }
            if (data.digitalFlowMeter) {
                application.digitalFlowMeter = data.digitalFlowMeter;
            }
            if (data.documents && Array.isArray(data.documents)) {
                // Ensure payment receipt or other final docs are appended/updated
                const existingDocs = application.documents || [];
                const newDocsMap = new Map(existingDocs.map(d => [d.documentType, d]));

                data.documents.forEach(doc => {
                    const existing = newDocsMap.get(doc.documentType);

                    // Prevention: If incoming doc has a 'doc_' ID but we already have a UUID, keep the UUID
                    if (existing && existing.documentId && !existing.documentId.startsWith('doc_')) {
                        if (doc.documentId && doc.documentId.startsWith('doc_')) {
                            doc.documentId = existing.documentId;
                        }
                    }

                    newDocsMap.set(doc.documentType, doc);
                });

                application.documents = Array.from(newDocsMap.values());
            }

            await application.save();

            return {
                applicationId: application._id,
                message: "Payment and final details saved successfully"
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get NOC Certificate details
     */
    async getCertificate(applicationId, userId) {
        try {
            // Check if applicationId is a valid MongoDB ObjectId
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(applicationId);

            const query = { userId };
            if (isObjectId) {
                query._id = applicationId;
            } else {
                query.applicationId = applicationId;
            }

            console.log(`[DEBUG] getCertificate - AppID: ${applicationId}, UserID: ${userId}`);
            console.log(`[DEBUG] getCertificate - Query:`, JSON.stringify(query));

            const application = await NOCApplication.findOne(query);

            console.log(`[DEBUG] getCertificate - Found App:`, application ? application._id : "NULL");

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            if (!application.nocCertificateId) {
                throw {
                    statusCode: 404,
                    code: "CERTIFICATE_NOT_FOUND",
                    message: "Certificate not issued yet",
                };
            }

            const certificate = await NOCCertificate.findById(application.nocCertificateId)
                .populate("applicationId", "applicationNumber projectDetails")
                .populate("userId", "firstName lastName");

            return certificate;
        } catch (error) {
            logger.error("Error fetching certificate", error);
            throw error;
        }
    }

    /**
     * Get Certificate File Path for Download
     */
    async getCertificateFilePath(applicationId, userId) {
        try {
            const certificate = await this.getCertificate(applicationId, userId);

            if (!certificate.certificatePDF) {
                throw {
                    statusCode: 404,
                    code: "FILE_NOT_FOUND",
                    message: "Certificate file not generated",
                };
            }

            return certificate.certificatePDF;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get Certificate File Path by Tracking ID (Public)
     */
    async getCertificateByTrackingId(trackingId) {
        try {
            const application = await NOCApplication.findOne({ trackingId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found with this tracking ID",
                };
            }

            if (!application.nocCertificateId) {
                throw {
                    statusCode: 404,
                    code: "CERTIFICATE_NOT_FOUND",
                    message: "NOC Certificate has not been issued yet",
                };
            }

            const certificate = await NOCCertificate.findById(application.nocCertificateId);

            if (!certificate || !certificate.certificatePDF) {
                throw {
                    statusCode: 404,
                    code: "FILE_NOT_FOUND",
                    message: "Certificate file not generated",
                };
            }

            return certificate.certificatePDF;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get Application Documents by Tracking ID
     */
    async getDocumentsByTrackingId(trackingId, user) {
        try {
            const application = await NOCApplication.findOne({ trackingId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found with this tracking ID",
                };
            }

            // Access Control Logic
            const userType = user.userType; // APPLICANT, DGO, SGWA, ENFORCEMENT

            // 1. Applicant/Owner Access
            if (userType === 'APPLICANT' || userType === 'USER') {
                if (application.userId.toString() !== user.id) {
                    throw {
                        statusCode: 403,
                        code: "UNAUTHORIZED_ACCESS",
                        message: "You are not authorized to view documents for this application",
                    };
                }
            }
            // 2. DGO Access (Can always view if it reached their stage or beyond)
            else if (userType === 'DGO') {
                // DGO can generally see everything submitted
            }
            // 3. SGWA Access (Only after DGO Approval)
            else if (userType === 'SGWA') { // Standardized SGWA role
                // Check if application has passed DGO stage
                const dgoPendingStatuses = [
                    "DRAFT", "SUBMITTED",
                    "PENDING_DGO_REVIEW", "UNDER_REVIEW_DGO",
                    "QUERY_RAISED_DGO", "REJECTED_DGO"
                ];

                if (dgoPendingStatuses.includes(application.status)) {
                    throw {
                        statusCode: 403,
                        code: "ACCESS_DENIED_PENDING_DGO",
                        message: "Application documents are not visible to SGWA until DGO approval.",
                    };
                }
            }
            // 4. Enforcement Access (Only after SGWA Approval)
            else if (userType === 'ENFORCEMENT') {
                // Check if application has passed SGWA stage
                // Basically must be APPROVED_SGWA or Enforcement stages
                const preEnforcementStatuses = [
                    "DRAFT", "SUBMITTED",
                    "PENDING_DGO_REVIEW", "UNDER_REVIEW_DGO", "QUERY_RAISED_DGO", "REJECTED_DGO", "APPROVED_DGO",
                    "PENDING_SGWA_REVIEW", "UNDER_REVIEW_SGWA", "QUERY_RAISED_SGWA", "REJECTED_SGWA"
                ];

                if (preEnforcementStatuses.includes(application.status)) {
                    throw {
                        statusCode: 403,
                        code: "ACCESS_DENIED_PENDING_SGWA",
                        message: "Application documents are not visible to Enforcement until SGWA approval.",
                    };
                }
            }

            // 5. Strict Assigned Officer Check
            const isAssigned = application.assignedTo && application.assignedTo.toString() === user.id;
            const isDistrictDGO = userType === 'DGO' && user.districtId && (application.location?.districtId === user.districtId);

            if (['DGO', 'SGWA', 'ENFORCEMENT'].includes(userType) && !isAssigned && !isDistrictDGO) {
                throw {
                    statusCode: 403,
                    code: "UNAUTHORIZED_OFFICER",
                    message: "You are not the assigned officer for this application.",
                };
            }

            // Return formatted documents
            return (application.documents || []).map(doc => ({
                documentId: doc.documentId,
                documentName: doc.fileName,
                documentType: doc.documentType,
                uploadedAt: doc.uploadedAt,
                isVerified: doc.isVerified,
                remarks: doc.remarks
            }));
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new NOCService();

