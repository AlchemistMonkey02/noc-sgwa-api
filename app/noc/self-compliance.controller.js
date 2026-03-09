const { v4: uuidv4 } = require('uuid');
const SelfCompliance = require('./self-compliance.model');
const NOCApplication = require('./noc-application.model');
const logger = require('../utils/logger');

class SelfComplianceController {
    /**
     * POST /api/self-compliance/start
     * Initialize new self-compliance session
     */
    async startCompliance(req, res, next) {
        try {
            const { applicationId } = req.body;

            if (!applicationId) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Application ID is required' }
                });
            }

            // Verify application exists
            const application = await NOCApplication.findOne({
                $or: [{ applicationId }, { _id: applicationId }]
            });

            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' }
                });
            }

            // Check if compliance already exists
            const existing = await SelfCompliance.findOne({
                applicationId: application._id,
                status: { $in: ['DRAFT', 'IN_PROGRESS'] }
            });

            if (existing) {
                return res.status(200).json({
                    success: true,
                    data: {
                        complianceId: existing.complianceId,
                        currentStep: existing.currentStep,
                        totalSteps: existing.totalSteps,
                        status: existing.status
                    },
                    message: 'Existing compliance session found'
                });
            }

            // Create new compliance session
            const complianceId = uuidv4();
            const compliance = await SelfCompliance.create({
                complianceId,
                applicationId: application._id,
                userId: req.user?.id || application.userId, // Use logged-in user or application owner
                currentStep: 1,
                status: 'IN_PROGRESS'
            });

            res.status(201).json({
                success: true,
                data: {
                    complianceId: compliance.complianceId,
                    currentStep: compliance.currentStep,
                    totalSteps: compliance.totalSteps
                },
                message: 'Compliance session started'
            });
        } catch (error) {
            logger.error('Error starting compliance', error);
            next(error);
        }
    }

    /**
     * POST /api/self-compliance/:id/step
     * Submit step data with validation
     */
    async submitStep(req, res, next) {
        try {
            const { id: complianceId } = req.params;
            const { step, responses } = req.body;

            const compliance = await SelfCompliance.findOne({ complianceId });

            if (!compliance) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'COMPLIANCE_NOT_FOUND', message: 'Compliance session not found' }
                });
            }

            // Validate sequential step access
            if (step > compliance.currentStep + 1) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'STEP_OUT_OF_ORDER',
                        message: `Please complete step ${compliance.currentStep} first`
                    }
                });
            }

            // Store responses for the step
            const stepKey = `step${step}`;
            compliance.responses[stepKey] = responses;

            // Update current step
            if (step >= compliance.currentStep) {
                compliance.currentStep = Math.min(step + 1, compliance.totalSteps);
            }

            await compliance.save();

            res.status(200).json({
                success: true,
                data: {
                    complianceId: compliance.complianceId,
                    currentStep: compliance.currentStep,
                    completedStep: step
                },
                message: `Step ${step} saved successfully`
            });
        } catch (error) {
            logger.error('Error submitting step', error);
            next(error);
        }
    }

    /**
     * POST /api/self-compliance/:id/upload
     * Upload compliance documents
     */
    async uploadDocument(req, res, next) {
        try {
            const { id: complianceId } = req.params;
            const { documentType } = req.body;

            const compliance = await SelfCompliance.findOne({ complianceId });

            if (!compliance) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'COMPLIANCE_NOT_FOUND', message: 'Compliance session not found' }
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'NO_FILE', message: 'No file uploaded' }
                });
            }

            // Add document to compliance
            compliance.documents.push({
                type: documentType || 'OTHER',
                fileName: req.file.originalname,
                filePath: `/uploads/compliance/${req.file.filename}`,
                uploadedAt: new Date()
            });

            await compliance.save();

            res.status(200).json({
                success: true,
                data: {
                    documentId: compliance.documents[compliance.documents.length - 1]._id,
                    fileName: req.file.originalname,
                    uploadedAt: new Date()
                },
                message: 'Document uploaded successfully'
            });
        } catch (error) {
            logger.error('Error uploading document', error);
            next(error);
        }
    }

    /**
     * AI-Based Auto-Validation Logic
     */
    autoValidate(compliance) {
        const issues = [];
        const warnings = [];
        let score = 100;

        const r = compliance.responses;

        // Critical checks (auto-reject if No)
        if (r.step1?.digitalFlowMetersInstalled === false) {
            issues.push('Digital flow meters not installed - MANDATORY');
            score -= 40;
        }

        if (r.step2?.quarterlyReportsSubmitted === false) {
            issues.push('Quarterly reports not submitted - MANDATORY');
            score -= 30;
        }

        if (r.step4?.extractionWithinLimits === false) {
            issues.push('Extraction exceeds approved limits - CRITICAL VIOLATION');
            score -= 50;
        }

        if (r.step5?.nocConditionsMet === false) {
            issues.push('NOC conditions not met - NON-COMPLIANT');
            score -= 40;
        }

        // Warnings (manual review)
        if (r.step3?.rainwaterHarvestingImplemented === false) {
            warnings.push('Rainwater harvesting not implemented - recommended');
            score -= 10;
        }

        if (r.step5?.anyViolations === true) {
            warnings.push('Violations reported - requires review');
            score -= 15;
        }

        // Document validation
        const requiredDocs = ['NOC_CERTIFICATE', 'FLOW_METER_CALIBRATION', 'QUARTERLY_DATA'];
        const uploadedTypes = compliance.documents.map(d => d.type);

        requiredDocs.forEach(docType => {
            if (!uploadedTypes.includes(docType)) {
                issues.push(`Missing required document: ${docType}`);
                score -= 20;
            }
        });

        // Determine status
        let status = 'PENDING';
        if (issues.length === 0 && score >= 90) {
            status = 'AUTO_APPROVED';
        } else if (score < 50 || issues.some(i => i.includes('CRITICAL') || i.includes('MANDATORY'))) {
            status = 'AUTO_REJECTED';
        } else {
            status = 'MANUAL_REVIEW_REQUIRED';
        }

        return {
            status,
            score: Math.max(0, score),
            criticalIssues: issues,
            warnings,
            validatedAt: new Date()
        };
    }

    /**
     * POST /api/self-compliance/:id/submit
     * Final submission with auto-validation
     */
    async finalSubmit(req, res, next) {
        try {
            const { id: complianceId } = req.params;

            const compliance = await SelfCompliance.findOne({ complianceId });

            if (!compliance) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'COMPLIANCE_NOT_FOUND', message: 'Compliance session not found' }
                });
            }

            // Check if all steps completed
            if (compliance.currentStep < compliance.totalSteps) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INCOMPLETE_STEPS',
                        message: `Please complete all ${compliance.totalSteps} steps before submitting`
                    }
                });
            }

            // Run AI auto-validation
            const validationResult = this.autoValidate(compliance);

            compliance.autoValidationResult = validationResult;
            compliance.status = 'SUBMITTED';
            compliance.submittedAt = new Date();

            await compliance.save();

            res.status(200).json({
                success: true,
                data: {
                    complianceId: compliance.complianceId,
                    status: compliance.status,
                    validationResult: {
                        autoStatus: validationResult.status,
                        score: validationResult.score,
                        criticalIssues: validationResult.criticalIssues,
                        warnings: validationResult.warnings
                    },
                    submittedAt: compliance.submittedAt
                },
                message: validationResult.status === 'AUTO_APPROVED'
                    ? '✅ Compliance AUTO-APPROVED! All requirements met.'
                    : validationResult.status === 'AUTO_REJECTED'
                        ? '❌ Compliance AUTO-REJECTED. Please address critical issues.'
                        : '⚠️ Compliance submitted for MANUAL REVIEW by officer.'
            });
        } catch (error) {
            logger.error('Error submitting compliance', error);
            next(error);
        }
    }

    /**
     * GET /api/self-compliance/:id/status
     * Get compliance status
     */
    async getStatus(req, res, next) {
        try {
            const { id: complianceId } = req.params;

            const compliance = await SelfCompliance.findOne({ complianceId })
                .populate('applicationId', 'applicationNumber')
                .populate('reviewedBy', 'firstName lastName');

            if (!compliance) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'COMPLIANCE_NOT_FOUND', message: 'Compliance not found' }
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    complianceId: compliance.complianceId,
                    applicationNumber: compliance.applicationId?.applicationNumber,
                    currentStep: compliance.currentStep,
                    totalSteps: compliance.totalSteps,
                    status: compliance.status,
                    responses: compliance.responses,
                    documents: compliance.documents,
                    autoValidationResult: compliance.autoValidationResult,
                    submittedAt: compliance.submittedAt,
                    reviewedBy: compliance.reviewedBy
                        ? `${compliance.reviewedBy.firstName} ${compliance.reviewedBy.lastName}`
                        : null,
                    reviewedAt: compliance.reviewedAt,
                    reviewRemarks: compliance.reviewRemarks
                },
                message: "Compliance status retrieved successfully"
            });
        } catch (error) {
            logger.error('Error getting compliance status', error);
            next(error);
        }
    }
}

module.exports = new SelfComplianceController();
