const nocService = require("./noc.service");
const NOCApplication = require("./noc-application.model");
const notificationService = require("../notifications/notification.service");

class NOCController {
    /**
     * POST /api/applications/noc
     * Create or update draft application
     */
    async createOrUpdateApplication(req, res, next) {
        try {
            // Automatically add userId and companyId from middleware
            const applicationData = {
                ...req.body,
                userId: req.user.id,           // From auth middleware
                companyId: req.company._id,    // From company middleware
            };

            const application = await nocService.createOrUpdateApplication(
                applicationData,
                req.user.id
            );

            res.status(req.body.applicationId ? 200 : 201).json({
                success: true,
                data: application,
                message: req.body.applicationId
                    ? "Application updated successfully"
                    : "Application created successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc
     * Get user's applications
     */
    async getUserApplications(req, res, next) {
        try {
            const result = await nocService.getUserApplications(req.user.id, req.query);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id
     * Get application details
     */
    async getApplicationById(req, res, next) {
        try {
            const application = await nocService.getApplicationById(
                req.params.id,
                req.user.id,
                req.user.userType
            );

            res.status(200).json({
                success: true,
                data: application,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id
     * Update application (alias for create/update)
     */
    async updateApplication(req, res, next) {
        try {
            req.body.applicationId = req.params.id;
            const application = await nocService.createOrUpdateApplication(req.body, req.user.id);

            res.status(200).json({
                success: true,
                data: application,
                message: "Application updated successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/submit
     * Submit application for review
     */
    async submitApplication(req, res, next) {
        try {
            const application = await nocService.submitApplication(req.params.id, req.user.id);

            res.status(200).json({
                success: true,
                data: {
                    applicationId: application.applicationId,
                    applicationNumber: application.applicationNumber,
                    status: application.status,
                    feeDetails: application.feeDetails,
                },
                message: "Application submitted successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/withdraw
     * Withdraw application
     */
    async withdrawApplication(req, res, next) {
        try {
            const application = await nocService.withdrawApplication(req.params.id, req.user.id);

            res.status(200).json({
                success: true,
                data: application,
                message: "Application withdrawn successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/queries
     * Get application queries
     */
    async getApplicationQueries(req, res, next) {
        try {
            const queries = await nocService.getApplicationQueries(req.params.id);

            res.status(200).json({
                success: true,
                count: queries.length,
                data: queries,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/queries/:queryId/respond
     * Respond to query
     */
    async respondToQuery(req, res, next) {
        try {
            const query = await nocService.respondToQuery(
                req.params.queryId,
                req.body.response,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: query,
                message: "Query responded successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/track/:applicationNumber (Public)
     * Track application status
     */
    async trackApplication(req, res, next) {
        try {
            const application = await nocService.trackApplication(req.params.applicationNumber);

            res.status(200).json({
                success: true,
                data: application,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/certificate
     * View NOC certificate details
     */
    async getCertificate(req, res, next) {
        try {
            const certificate = await nocService.getCertificate(
                req.params.id,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: certificate,
                message: "Certificate details fetched successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/certificate/download
     * Download NOC certificate (PDF)
     */
    async downloadCertificate(req, res, next) {
        try {
            const filePath = await nocService.getCertificateFilePath(
                req.params.id,
                req.user.id
            );

            const fs = require('fs');
            const path = require('path');

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "FILE_NOT_FOUND_ON_DISK",
                        message: "Certificate file missing from storage"
                    }
                });
            }

            // Set filename for download
            const fileName = `NOC_${req.params.id}.pdf`;
            res.download(filePath, fileName, (err) => {
                if (err) {
                    if (!res.headersSent) {
                        next(err);
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // ========== NEW: Section-wise Update Controllers ==========

    /**
     * PUT /api/applications/noc/:id/section1
     * Update Section 1: Basic Details
     */
    async updateSection1(req, res, next) {
        try {
            const application = await nocService.updateSection1(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 1 updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section2
     * Update Section 2: Location Details
     */
    async updateSection2(req, res, next) {
        try {
            const application = await nocService.updateSection2(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 2 updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section3
     * Update Section 3: Drinking & Domestic Use
     */
    async updateSection3(req, res, next) {
        try {
            const application = await nocService.updateSection3(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 3 updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section4
     * Update Section 4: Water Requirement Breakup
     */
    async updateSection4(req, res, next) {
        try {
            const application = await nocService.updateSection4(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 4 updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section5
     * Update Section 5: Ground Water Structures
     */
    async updateSection5(req, res, next) {
        try {
            const application = await nocService.updateSection5(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 5 updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section6
     * Update Section 6: Document Attachments
     */
    async updateSection6(req, res, next) {
        try {
            const application = await nocService.updateSection6(
                req.params.id,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 6 updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET/POST /api/applications/noc/:id/calculate-fees
     * Calculate application fees (Section 7)
     * Supports both GET (auto-fetch) and POST (manual inputs)
     */
    async calculateFees(req, res, next) {
        try {
            const feeCalculationService = require('./fee-calculation.service');

            // Manual inputs from request body (if POST) or query (if GET)
            const manualInputs = req.method === 'POST' ? req.body : req.query;

            const feeDetails = await feeCalculationService.calculateFees(
                req.params.id,
                manualInputs
            );

            res.status(200).json({
                success: true,
                data: feeDetails,
                message: "Fees calculated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/summary
     * Get application summary (Section 8)
     */
    async getApplicationSummary(req, res, next) {
        try {
            const summary = await nocService.getApplicationSummary(
                req.params.id,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: summary
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/validate
     * AI-driven pre-submission validation
     */
    async validateApplication(req, res, next) {
        try {
            const validatorService = require('./application-validator.service');

            const validationResults = await validatorService.validateBeforeSubmission(req.params.id);

            res.status(200).json({
                success: true,
                data: validationResults,
                message: validationResults.canSubmit
                    ? "Application is ready for submission"
                    : "Application needs improvements before submission"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/section-status
     * Get section completion status
     */
    async getSectionStatus(req, res, next) {
        try {
            const status = await nocService.getSectionCompletionStatus(req.params.id);

            res.status(200).json({
                success: true,
                data: status
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/validate-section/:sectionNumber
     * Validate specific section
     */
    async validateSection(req, res, next) {
        try {
            const { id, sectionNumber } = req.params;
            const validation = await nocService.validateSection(id, parseInt(sectionNumber));

            res.status(200).json({
                success: validation.isValid,
                data: validation,
                message: validation.isValid ? "Section is valid" : "Section has validation errors"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/progress
     * Get application progress
     */
    async getApplicationProgress(req, res, next) {
        try {
            const progress = await nocService.getApplicationProgress(
                req.params.id,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: progress
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/timeline
     * Get detailed timeline
     */
    async getApplicationTimeline(req, res, next) {
        try {
            const timeline = await nocService.getApplicationTimeline(
                req.params.id,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: timeline
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/:id/documents
     * Link documents to application
     */
    async linkDocuments(req, res, next) {
        try {
            const { documentIds } = req.body;

            const application = await nocService.linkDocuments(
                req.params.id,
                documentIds,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application.documents,
                message: "Documents linked successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/documents
     * Get application documents
     */
    async getApplicationDocuments(req, res, next) {
        try {
            const documents = await nocService.getApplicationDocuments(
                req.params.id,
                req.user.id
            );

            res.status(200).json({
                success: true,
                count: documents.length,
                data: documents
            });
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // SECTION-WISE UPDATE METHODS (8-Section CGWA Workflow)
    // ============================================

    /**
     * PUT /api/applications/noc/:id/section1
     * Update Section 1: Basic Details
     */
    async updateSection1(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                1,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 1 (Basic Details) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section2
     * Update Section 2: Location Details
     */
    async updateSection2(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                2,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 2 (Location Details) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section3
     * Update Section 3: Drinking & Domestic Use
     */
    async updateSection3(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                3,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 3 (Drinking & Domestic Use) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section4
     * Update Section 4: Water Requirement Breakup
     */
    async updateSection4(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                4,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 4 (Water Requirement Breakup) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section5
     * Update Section 5: Ground Water Structures
     */
    async updateSection5(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                5,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 5 (Ground Water Structures) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/section6
     * Update Section 6: Document Attachments
     */
    async updateSection6(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                6,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Section 6 (Document Attachments) updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/applications/noc/:id/flow-meter
     * Update Digital Flow Meter (Section 9)
     */
    async updateDigitalFlowMeter(req, res, next) {
        try {
            const application = await nocService.updateSection(
                req.params.id,
                9,
                req.body,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: application,
                message: "Digital Flow Meter details updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/track/:applicationId
     * Track application status and timeline
     */
    async trackApplication(req, res, next) {
        try {
            // Handle wildcard route: applicationId might be in params.applicationId or params[0]
            const applicationId = req.params.applicationId || req.params[0];

            // Fetch application by applicationId (UUID) OR applicationNumber OR trackingId
            const application = await NOCApplication.findOne({
                $or: [
                    { applicationId: applicationId },
                    { applicationNumber: applicationId },
                    { trackingId: applicationId }
                ]
            })
                .select("applicationId applicationNumber trackingId projectType applicationType submittedAt status workflowHistory applicationCategory");

            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: "Application not found"
                });
            }

            // Status Hierarchy/Rank
            const statusRank = {
                "DRAFT": 0,
                "SUBMITTED": 1,

                // DGO (Level 2)
                "PENDING_DGO_REVIEW": 2, "UNDER_REVIEW_DGO": 2, "QUERY_RAISED_DGO": 2, "REJECTED_DGO": 2,
                "APPROVED_DGO": 3,

                // SGWA (Level 4)
                "PENDING_SGWA_REVIEW": 4, "UNDER_REVIEW_SGWA": 4, "QUERY_RAISED_SGWA": 4, "REJECTED_SGWA": 4,
                "APPROVED_SGWA": 5,

                // Enforcement (Level 6)
                "PENDING_ENFORCEMENT_REVIEW": 6, "INSPECTION_SCHEDULED": 6, "INSPECTED": 6, "UNDER_REVIEW_ENFORCEMENT": 6, "QUERY_RAISED_ENFORCEMENT": 6, "REJECTED_ENFORCEMENT": 6,
                "APPROVED_ENFORCEMENT": 7,

                // Final (Level 8)
                "NOC_ISSUED": 8, "WITHDRAWN": 8
            };

            const currentRank = statusRank[application.status] || 0;
            let currentLocation = "Applicant";
            if (currentRank === 1) currentLocation = "System Processing";
            else if (currentRank >= 2 && currentRank < 4) currentLocation = "District Groundwater Office (DGO)";
            else if (currentRank >= 4 && currentRank < 6) currentLocation = "State Groundwater Authority (SGWA)";
            else if (currentRank >= 6 && currentRank < 8) currentLocation = "Enforcement Wing";
            else if (currentRank === 8) currentLocation = "Issued";

            // Map Status to Timeline Steps
            const timeline = [
                {
                    step: 1,
                    title: "Application Submitted",
                    description: "Application received by system.",
                    status: "COMPLETED",
                    date: application.submittedAt
                },
                {
                    step: 2,
                    title: "Document Verification",
                    description: "Initial scrutiny of uploaded documents (DGO).",
                    status: currentRank >= 3 ? "COMPLETED" : "PENDING",
                },
                {
                    step: 3,
                    title: "SGWA Review",
                    description: "Verification by State Ground Water Authority.",
                    status: currentRank >= 5 ? "COMPLETED" : "PENDING",
                },
                {
                    step: 4,
                    title: "Enforcement Wing",
                    description: "Final verification by Enforcement Wing.",
                    status: currentRank >= 7 ? "COMPLETED" : "PENDING",
                },
                {
                    step: 5,
                    title: "Final Approval",
                    description: "NOC generated and ready for download.",
                    status: currentRank >= 8 ? "COMPLETED" : "PENDING",
                }
            ];

            res.status(200).json({
                success: true,
                data: {
                    applicationId: application.applicationId,
                    applicationNumber: application.applicationNumber,
                    trackingId: application.trackingId,
                    status: application.status,
                    projectName: application.projectType,
                    applicationType: application.applicationType,
                    category: application.applicationCategory,
                    submittedDate: application.submittedAt,
                    currentLocation: currentLocation,
                    timeline: timeline
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/applications/noc/approve-step
     * Manually approve timeline steps (No Auth)
     */
    async updateTimelineStep(req, res, next) {
        try {
            const { applicationId, step } = req.body;

            if (!applicationId || !step) {
                return res.status(400).json({ success: false, message: "applicationId and step are required" });
            }

            let newStatus = "";
            switch (parseInt(step)) {
                case 2: newStatus = "APPROVED_DGO"; break;
                case 3: newStatus = "APPROVED_SGWA"; break;
                case 4: newStatus = "APPROVED_ENFORCEMENT"; break;
                case 5: newStatus = "NOC_ISSUED"; break;
                default:
                    return res.status(400).json({ success: false, message: "Invalid step (2-5)" });
            }

            // Find by any ID
            const application = await NOCApplication.findOne({
                $or: [
                    { applicationId: applicationId },
                    { applicationNumber: applicationId },
                    { trackingId: applicationId }
                ]
            });

            if (!application) {
                return res.status(404).json({ success: false, message: "Application not found" });
            }

            application.status = newStatus;
            await application.save({ validateBeforeSave: false }); // Skip other validation

            // Send notification
            notificationService.send(application.userId, newStatus, {
                applicationNumber: application.applicationNumber,
                projectName: application.projectDetails?.projectName || 'Project',
            }).catch(err => console.error("Failed to send notification", err));

            // Determine flags for UI
            const allApproved = newStatus === "NOC_ISSUED";
            const almostApproved = ["APPROVED_SGWA", "APPROVED_ENFORCEMENT"].includes(newStatus);
            const maybeApproved = !allApproved && !almostApproved;

            res.status(200).json({
                success: true,
                message: `Application moved to step ${step} (Status: ${newStatus})`,
                data: {
                    applicationId: application.applicationId,
                    status: application.status,
                    allApproved,
                    almostApproved,
                    maybeApproved
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/processing-estimates
     * Get estimated processing timelines (Best/Normal/Delayed)
     */
    async getProcessingEstimates(req, res, next) {
        try {
            const { allApproved, almostApproved, maybeApproved } = req.query;

            const estimates = {
                bestCase: {
                    label: "Best Case",
                    conditions: ["Documents correct", "Inspection completed in first visit", "Area category already mapped"],
                    duration: "~30–45 days",
                    color: "green"
                },
                normalCase: {
                    label: "Normal Case",
                    conditions: ["Standard verification & inspection"],
                    duration: "~45–60 days",
                    color: "yellow"
                },
                delayedCase: {
                    label: "Delayed Case",
                    conditions: ["Clarification required", "Re-inspection", "Incomplete hydro data"],
                    duration: "60–90+ days",
                    color: "red"
                }
            };

            let data = estimates;

            // Filter logic based on input flags
            if (allApproved === 'true') {
                data = { selectedEstimate: estimates.bestCase };
            } else if (almostApproved === 'true') {
                data = { selectedEstimate: estimates.normalCase };
            } else if (maybeApproved === 'true') { // Or 'delayed'
                data = { selectedEstimate: estimates.delayedCase };
            }

            res.status(200).json({
                success: true,
                data: data,
                message: "Processing estimates retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/calculate-fees
     * Calculate application fees (Section 7: GW Charges)
     */
    async calculateFees(req, res, next) {
        try {
            const feeCalculation = await nocService.calculateApplicationFees(
                req.params.id,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: feeCalculation,
                message: "Fees calculated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/applications/noc/:id/summary
     * Get application summary (Section 8: Summary & Payment)
     */
    async getApplicationSummary(req, res, next) {
        try {
            const summary = await nocService.getApplicationSummary(
                req.params.id,
                req.user.id
            );

            res.status(200).json({
                success: true,
                data: summary,
                message: "Application summary retrieved successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NOCController();

