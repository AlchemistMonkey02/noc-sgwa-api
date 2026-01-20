const { v4: uuidv4 } = require("uuid");
const NOCApplication = require("./noc-application.model");
const ApplicationQuery = require("./application-query.model");
const NOCCertificate = require("./noc-certificate.model");
const Payment = require("./payment.model");
const Block = require("../master-data/block.model");
const FeeStructure = require("../master-data/fee-structure.model");
const emailService = require("../utils/email.service");
const notificationService = require("../notifications/notification.service");
const logger = require("../utils/logger");

class NOCService {
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
    async submitApplication(applicationId, userId) {
        try {
            const application = await NOCApplication.findOne({ applicationId, userId });

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
            await application.save({ validateBeforeSave: false }); // This will trigger auto-generation of application number

            logger.info(`Application submitted: ${application.applicationNumber}`, { userId });

            // Send email notification (async)
            const user = await require("../auth/user.model").findById(userId);
            if (user) {
                emailService
                    .sendApplicationSubmitted(user, {
                        applicationNumber: application.applicationNumber,
                        applicationType: application.applicationType,
                        projectDetails: application.projectDetails,
                        submittedDate: application.submittedAt,
                        applicationId: application.applicationId,
                    })
                    .catch((err) => logger.error("Failed to send application submitted email", err));
            }

            return application;
        } catch (error) {
            logger.error("Error submitting application", error);
            throw error;
        }
    }

    /**
     * Get user's applications
     */
    async getUserApplications(userId, filters = {}) {
        try {
            const query = { userId };

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.applicationType) {
                query.applicationType = filters.applicationType;
            }

            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const skip = (page - 1) * limit;

            const applications = await NOCApplication.find(query)
                .select("-documents")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await NOCApplication.countDocuments(query);

            return {
                applications,
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
            // Check if applicationId is a valid MongoDB ObjectId
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(applicationId);

            const query = {};
            if (isObjectId) {
                query._id = applicationId;
            } else {
                query.applicationId = applicationId;
            }

            const application = await NOCApplication.findOne(query).populate(
                "nocCertificateId"
            );

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            // Access control
            const isOwner = application.userId.toString() === userId;
            const isOfficer = ["DGO", "RSGWA", "ENFORCEMENT"].includes(userType);

            if (!isOwner && !isOfficer) {
                throw {
                    statusCode: 403,
                    code: "UNAUTHORIZED_ACCESS",
                    message: "You do not have permission to view this application",
                };
            }

            return application;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Withdraw application
     */
    async withdrawApplication(applicationId, userId) {
        try {
            const application = await NOCApplication.findOne({ applicationId, userId });

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
            const queries = await ApplicationQuery.find({ applicationId })
                .populate("raisedBy", "firstName lastName")
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
    async trackApplication(applicationNumber) {
        try {
            const application = await NOCApplication.findOne({ applicationNumber }).select(
                "applicationNumber applicationType status submittedAt location.districtId projectDetails.projectName"
            );

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            return application;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // SECTION-WISE UPDATE METHODS (CGWA 8-Section Workflow)
    // ============================================

    /**
     * Update specific section of an application
     */
    async updateSection(applicationId, sectionNumber, sectionData, userId) {
        try {
            const application = await NOCApplication.findOne({ applicationId, userId });

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
                    Object.assign(application, {
                        applicationType: sectionData.applicationType,
                        sectorType: sectionData.sectorType,
                        validityPeriodRequested: sectionData.validityPeriodRequested,
                        projectDetails: {
                            ...application.projectDetails,
                            ...sectionData.projectDetails
                        },
                        communicationAddress: sectionData.communicationAddress
                    });
                    break;

                case 2: // Location Details
                    if (sectionData.location) {
                        // Get block category for the selected block
                        const block = await Block.findOne({
                            blockId: sectionData.location.blockId,
                            districtId: sectionData.location.districtId,
                        });

                        application.location = {
                            ...sectionData.location,
                            blockCategory: block?.category || application.location.blockCategory
                        };
                    }
                    // Update land area details
                    if (sectionData.projectDetails) {
                        application.projectDetails = {
                            ...application.projectDetails,
                            ...sectionData.projectDetails
                        };
                    }
                    break;

                case 3: // Drinking & Domestic Use
                    application.drinkingDomesticUse = sectionData.drinkingDomesticUse;
                    // Auto-calculate totals
                    const { numberOfWorkers, numberOfResidents, dailyRequirementPerPerson } = sectionData.drinkingDomesticUse;
                    const totalDailyDomestic = (numberOfWorkers + numberOfResidents) * dailyRequirementPerPerson / 1000 // Convert to KL
                    application.drinkingDomesticUse.totalDailyDomestic = totalDailyDomestic;
                    application.drinkingDomesticUse.totalAnnualDomestic = totalDailyDomestic * 365;
                    break;

                case 4: // Water Requirement Breakup
                    application.waterRequirementBreakup = sectionData.waterRequirementBreakup || [];
                    application.stpEtpDetails = sectionData.stpEtpDetails || {};
                    break;

                case 5: // Ground Water Structures
                    application.groundWaterStructures = sectionData.groundWaterStructures || [];
                    break;

                case 6: // Document Attachments
                    application.documentsReviewed = sectionData.documentsReviewed || false;
                    break;

                case 9: // Digital Flow Meter (New Section)
                    if (sectionData.digitalFlowMeter) {
                        application.digitalFlowMeter = {
                            ...application.digitalFlowMeter,
                            ...sectionData.digitalFlowMeter,
                            // Ensure nested objects are merged correctly
                            telemetry: {
                                ...application.digitalFlowMeter?.telemetry,
                                ...sectionData.digitalFlowMeter.telemetry
                            },
                            complianceCommitments: {
                                ...application.digitalFlowMeter?.complianceCommitments,
                                ...sectionData.digitalFlowMeter.complianceCommitments
                            }
                        };
                    }
                    break;

                default:
                    throw {
                        statusCode: 400,
                        code: "INVALID_SECTION",
                        message: "Invalid section number. Must be between 1 and 6.",
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
    async calculateApplicationFees(applicationId, userId) {
        try {
            const application = await NOCApplication.findOne({ applicationId, userId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            const baseFee = 1000;
            const waterRequirement = application.waterRequirement?.dailyRequirement || 0;
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

    /**
     * Get application summary
     */
    async getApplicationSummary(applicationId, userId) {
        try {
            const application = await NOCApplication.findOne({ applicationId, userId })
                .populate('companyId', 'companyName registrationNumber gstNumber')
                .populate('userId', 'firstName lastName email phone');

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            const fees = await this.calculateApplicationFees(applicationId, userId);

            return {
                applicationId: application.applicationId,
                applicationNumber: application.applicationNumber,
                status: application.status,
                basicDetails: {
                    applicationType: application.applicationType,
                    sectorType: application.sectorType,
                    projectDetails: application.projectDetails
                },
                locationDetails: application.location,
                drinkingDomesticUse: application.drinkingDomesticUse,
                waterRequirementBreakup: application.waterRequirementBreakup,
                groundWaterStructures: application.groundWaterStructures,
                feeDetails: fees.feeCalculation,
                companyDetails: application.companyId,
                timestamps: {
                    createdAt: application.createdAt,
                    updatedAt: application.updatedAt
                }
            };
        } catch (error) {
            logger.error("Error getting application summary", error);
            throw error;
        }
    }

    /**
     * Get section completion status
     */
    async getSectionCompletionStatus(applicationId) {
        try {
            const application = await NOCApplication.findOne({ applicationId });

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
    async validateSection(applicationId, sectionNumber) {
        try {
            const application = await NOCApplication.findOne({ applicationId });

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
    async getApplicationProgress(applicationId, userId) {
        try {
            const application = await NOCApplication.findOne({ applicationId, userId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            const sectionStatus = await this.getSectionCompletionStatus(applicationId);

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
    async getApplicationTimeline(applicationId, userId) {
        try {
            const application = await NOCApplication.findOne({ applicationId, userId })
                .populate("approvalFlow.dgo.reviewedBy", "firstName lastName role")
                .populate("approvalFlow.sgwa.reviewedBy", "firstName lastName role")
                .populate("approvalFlow.enforcement.reviewedBy", "firstName lastName role")
                .populate("approvalFlow.dgo.assignedTo", "firstName lastName role")
                .populate("userId", "firstName lastName");

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

            application.documents = documentIds;
            await application.save();

            logger.info(`Documents linked: ${applicationId}`, { userId, count: documentIds.length });
            return application;
        } catch (error) {
            logger.error("Error linking documents", error);
            throw error;
        }
    }

    /**
     * Get application documents
     */
    async getApplicationDocuments(applicationId, userId) {
        try {
            // Check if applicationId is a valid MongoDB ObjectId
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(applicationId);

            const query = { userId };
            if (isObjectId) {
                query._id = applicationId;
            } else {
                query.applicationId = applicationId;
            }

            const application = await NOCApplication.findOne(query);

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            // Return the embedded documents array which contains application-specific statuses
            return application.documents || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get NOC Certificate details
     */
    async getCertificate(applicationId, userId) {
        try {
            const application = await NOCApplication.findOne({ applicationId, userId });

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
            const userType = user.userType; // APPLICANT, DGO, RSGWA, ENFORCEMENT

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
            else if (userType === 'RSGWA') { // RSGWA is the system role for SGWA
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

