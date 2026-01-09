const { v4: uuidv4 } = require("uuid");
const NOCApplication = require("./noc-application.model");
const ApplicationQuery = require("./application-query.model");
const NOCCertificate = require("./noc-certificate.model");
const Payment = require("./payment.model");
const Block = require("../master-data/block.model");
const FeeStructure = require("../master-data/fee-structure.model");
const emailService = require("../utils/email.service");
const logger = require("../utils/logger");

class NOCService {
    /**
     * Create or update draft application
     */
    async createOrUpdateApplication(data, userId) {
        try {
            const applicationId = data.applicationId || uuidv4();

            // Get block category
            const block = await Block.findOne({
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

            const applicationData = {
                ...data,
                applicationId,
                userId,
                location: {
                    ...data.location,
                    blockCategory: block.category,
                },
                status: "DRAFT",
            };

            const application = await NOCApplication.findOneAndUpdate(
                { applicationId, userId },
                { $set: applicationData },
                { new: true, upsert: true, runValidators: true }
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

            const docValidation = await validateDocumentCompleteness(
                application,
                application.userId,
                application.companyId
            );

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

            // Calculate fees
            const feeStructure = await FeeStructure.findOne({
                applicationType: application.applicationType,
                blockCategory: application.location.blockCategory,
                isActive: true,
            }).sort({ effectiveFrom: -1 });

            if (!feeStructure) {
                throw {
                    statusCode: 404,
                    code: "FEE_STRUCTURE_NOT_FOUND",
                    message: "Fee structure not found for this application type and block category",
                };
            }

            const ecCharges =
                feeStructure.ecChargesPerMLD * application.waterRequirement.dailyRequirement;
            const totalAmount = feeStructure.calculateTotalFee(
                application.waterRequirement.dailyRequirement
            );

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
            await application.save(); // This will trigger auto-generation of application number

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
            const application = await NOCApplication.findOne({ applicationId }).populate(
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

                default:
                    throw {
                        statusCode: 400,
                        code: "INVALID_SECTION",
                        message: "Invalid section number. Must be between 1 and 6.",
                    };
            }

            await application.save();
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
    async getApplicationTimeline(applicationId, userId) {
        try {
            const application = await NOCApplication.findOne({ applicationId, userId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            const timeline = [
                {
                    event: "APPLICATION_CREATED",
                    timestamp: application.createdAt,
                    description: "Application draft created"
                }
            ];

            if (application.submittedAt) {
                timeline.push({
                    event: "APPLICATION_SUBMITTED",
                    timestamp: application.submittedAt,
                    description: "Application submitted"
                });
            }

            return {
                applicationId,
                timeline: timeline.sort((a, b) => b.timestamp - a.timestamp)
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
            const application = await NOCApplication.findOne({ applicationId, userId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: "APPLICATION_NOT_FOUND",
                    message: "Application not found",
                };
            }

            const Document = require("../documents/document.model");
            const documents = await Document.find({
                applicationId: application._id,
                userId: application.userId
            });

            return documents;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new NOCService();

