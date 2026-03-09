const { v4: uuidv4 } = require('uuid');
const NOCApplication = require('./noc-application.model');
const ComplianceReport = require('./compliance-report.model');
const logger = require('../utils/logger');

class ComplianceController {
    /**
     * GET /api/applications/noc/search
     * Search for NOC by application number
     */
    async searchApplication(req, res, next) {
        try {
            const { applicationNumber } = req.query;

            if (!applicationNumber) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_APPLICATION_NUMBER',
                        message: 'Application number is required'
                    }
                });
            }

            const application = await NOCApplication.findOne({ applicationNumber })
                .populate('companyId', 'companyName address')
                .select('applicationId applicationNumber projectType applicationType status createdAt submittedAt');

            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'APPLICATION_NOT_FOUND',
                        message: 'No application found with this number'
                    }
                });
            }

            // Mock NOC data (replace with actual NOC certificate model when available)
            const nocData = {
                applicationId: application.applicationId,
                applicationNumber: application.applicationNumber,
                nocNumber: `CGWA/NOC/${application.applicationType}/2021/12345`, // Generate proper NOC number
                firmName: application.companyId?.companyName || 'N/A',
                projectName: application.projectType,
                address: application.companyId?.address || 'N/A',
                nocIssueDate: application.submittedAt,
                nocExpiryDate: new Date(new Date(application.submittedAt).setFullYear(new Date(application.submittedAt).getFullYear() + 5)),
                status: application.status,
                category: application.applicationCategory || 'INDUSTRIAL',
                extractionQuantity: 500, // Replace with actual data
                complianceRequired: true
            };

            res.status(200).json({
                success: true,
                data: nocData,
                message: "Application search completed"
            });
        } catch (error) {
            logger.error('Error searching application', error);
            next(error);
        }
    }

    /**
     * GET /api/noc/:nocId/details
     * Get detailed NOC information
     */
    async getNOCDetails(req, res, next) {
        try {
            const { nocId } = req.params;

            const application = await NOCApplication.findOne({
                $or: [
                    { applicationId: nocId },
                    { _id: nocId }
                ]
            })
                .populate('userId', 'firstName lastName email phone')
                .populate('companyId', 'companyName address');

            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOC_NOT_FOUND',
                        message: 'NOC not found'
                    }
                });
            }

            // Get compliance history
            const complianceHistory = await ComplianceReport.find({
                applicationId: application._id
            })
                .sort({ submittedDate: -1 })
                .limit(5)
                .select('reportId reportingYear submittedDate complianceStatus reviewStatus reviewRemarks');

            const response = {
                nocId: application.applicationId,
                applicationNumber: application.applicationNumber,
                nocNumber: `CGWA/NOC/${application.applicationType}/2021/12345`,
                applicantDetails: {
                    name: `${application.userId?.firstName || ''} ${application.userId?.lastName || ''}`.trim(),
                    firmName: application.companyId?.companyName || 'N/A',
                    address: application.companyId?.address || 'N/A',
                    mobile: application.userId?.phone || 'N/A',
                    email: application.userId?.email || 'N/A'
                },
                nocDetails: {
                    issueDate: application.submittedAt,
                    expiryDate: new Date(new Date(application.submittedAt).setFullYear(new Date(application.submittedAt).getFullYear() + 5)),
                    validityPeriod: '5 Years',
                    status: application.status === 'NOC_ISSUED' ? 'ACTIVE' : 'PENDING'
                },
                extractionDetails: {
                    approvedQuantity: 500, // Replace with actual data from application
                    unit: 'm³/day',
                    purpose: application.groundWaterUtilizationFor || 'N/A',
                    numberOfWells: application.groundWaterStructures?.length || 0
                },
                complianceRequirements: {
                    annualReportRequired: true,
                    frequencyMonths: 12,
                    nextDueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    conditions: [
                        'Install digital flow meters on all wells',
                        'Submit quarterly extraction data',
                        'Maintain rainwater harvesting structures',
                        'Not exceed approved extraction limit'
                    ]
                },
                complianceHistory: complianceHistory.map(report => ({
                    reportId: report.reportId,
                    year: report.reportingYear,
                    submittedDate: report.submittedDate,
                    status: report.complianceStatus,
                    remarks: report.reviewRemarks || 'Pending review'
                }))
            };

            res.status(200).json({
                success: true,
                data: response,
                message: "NOC details retrieved successfully"
            });
        } catch (error) {
            logger.error('Error getting NOC details', error);
            next(error);
        }
    }

    /**
     * POST /api/noc/compliance/submit
     * Submit compliance report
     */
    async submitReport(req, res, next) {
        try {
            const { nocId, reportingYear, complianceStatus, isRebateClaimed, remarks } = req.body;
            let waterExtractionData = req.body.waterExtractionData;

            // Parse if it's a string
            if (typeof waterExtractionData === 'string') {
                waterExtractionData = JSON.parse(waterExtractionData);
            }

            // Validation
            if (!nocId || !reportingYear || !complianceStatus) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Missing required fields',
                        details: {
                            nocId: !nocId ? 'NOC ID is required' : undefined,
                            reportingYear: !reportingYear ? 'Reporting year is required' : undefined,
                            complianceStatus: !complianceStatus ? 'Compliance status is required' : undefined
                        }
                    }
                });
            }

            // Find application
            const application = await NOCApplication.findOne({
                $or: [
                    { applicationId: nocId },
                    { _id: nocId }
                ]
            });

            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOC_NOT_FOUND',
                        message: 'NOC not found'
                    }
                });
            }

            // Check for duplicate report
            const existingReport = await ComplianceReport.findOne({
                applicationId: application._id,
                reportingYear
            });

            if (existingReport) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'DUPLICATE_REPORT',
                        message: `Compliance report for year ${reportingYear} already exists`
                    }
                });
            }

            // Handle file upload
            let reportFileUrl = '';
            let reportFileName = '';
            if (req.file) {
                reportFileUrl = `/uploads/compliance/${req.file.filename}`;
                reportFileName = req.file.originalname;
            }

            // Generate acknowledgment number
            const ackNumber = `ACK/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`;

            // Create report
            const reportId = uuidv4();
            const report = await ComplianceReport.create({
                reportId,
                nocId: application.applicationId,
                applicationId: application._id,
                applicationNumber: application.applicationNumber,
                nocNumber: `CGWA/NOC/${application.applicationType}/2021/12345`,
                reportingYear,
                complianceStatus,
                isRebateClaimed: isRebateClaimed === 'true' || isRebateClaimed === true,
                remarks,
                reportFileUrl,
                reportFileName,
                acknowledgmentNumber: ackNumber,
                waterExtractionData,
                createdBy: req.user.id,
                status: 'SUBMITTED'
            });

            res.status(201).json({
                success: true,
                data: {
                    reportId: report.reportId,
                    nocId: report.nocId,
                    reportingYear: report.reportingYear,
                    submittedDate: report.submittedDate,
                    status: report.status,
                    complianceStatus: report.complianceStatus,
                    reportFileUrl: report.reportFileUrl,
                    acknowledgmentNumber: report.acknowledgmentNumber,
                    nextDueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                },
                message: 'Compliance report submitted successfully'
            });
        } catch (error) {
            logger.error('Error submitting compliance report', error);
            next(error);
        }
    }

    /**
     * GET /api/noc/:nocId/compliance/history
     * Get compliance history
     */
    async getHistory(req, res, next) {
        try {
            const { nocId } = req.params;
            const { page = 1, limit = 10, year } = req.query;

            // Find application
            const application = await NOCApplication.findOne({
                $or: [
                    { applicationId: nocId },
                    { _id: nocId }
                ]
            });

            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOC_NOT_FOUND',
                        message: 'NOC not found'
                    }
                });
            }

            // Build query
            const query = { applicationId: application._id };
            if (year) {
                query.reportingYear = year;
            }

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const reports = await ComplianceReport.find(query)
                .sort({ submittedDate: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('reviewedBy', 'firstName lastName');

            const totalReports = await ComplianceReport.countDocuments(query);

            res.status(200).json({
                success: true,
                data: {
                    reports: reports.map(report => ({
                        reportId: report.reportId,
                        nocId: report.nocId,
                        reportingYear: report.reportingYear,
                        submittedDate: report.submittedDate,
                        complianceStatus: report.complianceStatus,
                        isRebateClaimed: report.isRebateClaimed,
                        remarks: report.remarks,
                        reportFileUrl: report.reportFileUrl,
                        acknowledgmentNumber: report.acknowledgmentNumber,
                        reviewStatus: report.reviewStatus,
                        reviewedBy: report.reviewedBy ? `${report.reviewedBy.firstName} ${report.reviewedBy.lastName}` : null,
                        reviewDate: report.reviewDate,
                        reviewRemarks: report.reviewRemarks
                    })),
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalReports / parseInt(limit)),
                        totalReports,
                        limit: parseInt(limit)
                    }
                },
                message: "Compliance history retrieved successfully"
            });
        } catch (error) {
            logger.error('Error getting compliance history', error);
            next(error);
        }
    }

    /**
     * PUT /api/noc/compliance/:reportId
     * Update compliance report
     */
    async updateReport(req, res, next) {
        try {
            const { reportId } = req.params;
            const { remarks } = req.body;
            let waterExtractionData = req.body.waterExtractionData;

            if (typeof waterExtractionData === 'string') {
                waterExtractionData = JSON.parse(waterExtractionData);
            }

            const report = await ComplianceReport.findOne({ reportId });

            if (!report) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'REPORT_NOT_FOUND',
                        message: 'Compliance report not found'
                    }
                });
            }

            // Check if report is locked (already reviewed)
            if (report.reviewStatus !== 'PENDING') {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'REPORT_LOCKED',
                        message: 'Cannot update report that has already been reviewed'
                    }
                });
            }

            // Update fields
            if (remarks) report.remarks = remarks;
            if (waterExtractionData) report.waterExtractionData = waterExtractionData;
            report.lastUpdatedDate = new Date();
            report.status = 'UPDATED';

            await report.save();

            res.status(200).json({
                success: true,
                data: {
                    reportId: report.reportId,
                    nocId: report.nocId,
                    reportingYear: report.reportingYear,
                    submittedDate: report.submittedDate,
                    lastUpdatedDate: report.lastUpdatedDate,
                    status: report.status,
                    complianceStatus: report.complianceStatus,
                    remarks: report.remarks
                },
                message: 'Compliance report updated successfully'
            });
        } catch (error) {
            logger.error('Error updating compliance report', error);
            next(error);
        }
    }

    /**
     * DELETE /api/noc/compliance/:reportId
     * Delete compliance report
     */
    async deleteReport(req, res, next) {
        try {
            const { reportId } = req.params;

            const report = await ComplianceReport.findOne({ reportId });

            if (!report) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'REPORT_NOT_FOUND',
                        message: 'Compliance report not found'
                    }
                });
            }

            // Check if report is locked
            if (report.reviewStatus !== 'PENDING') {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'REPORT_LOCKED',
                        message: 'Cannot delete report that has already been reviewed'
                    }
                });
            }

            await ComplianceReport.deleteOne({ reportId });

            res.status(200).json({
                success: true,
                message: 'Compliance report deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting compliance report', error);
            next(error);
        }
    }

    /**
     * POST /api/noc/compliance/:reportId/review
     * Officer reviews and approves/rejects compliance report
     */
    async reviewComplianceReport(req, res, next) {
        try {
            const { reportId } = req.params;
            const { reviewStatus, reviewRemarks } = req.body;

            if (!reviewStatus) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Review status is required'
                    }
                });
            }

            const report = await ComplianceReport.findOne({ reportId });

            if (!report) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'REPORT_NOT_FOUND',
                        message: 'Compliance report not found'
                    }
                });
            }

            // Update review details
            report.reviewStatus = reviewStatus;
            report.reviewRemarks = reviewRemarks || '';
            report.reviewedBy = req.user.id;
            report.reviewDate = new Date();
            report.status = 'REVIEWED';

            await report.save();

            res.status(200).json({
                success: true,
                data: {
                    reportId: report.reportId,
                    nocId: report.nocId,
                    reportingYear: report.reportingYear,
                    complianceStatus: report.complianceStatus,
                    reviewStatus: report.reviewStatus,
                    reviewRemarks: report.reviewRemarks,
                    reviewDate: report.reviewDate
                },
                message: `Compliance report ${reviewStatus.toLowerCase()} successfully`
            });
        } catch (error) {
            logger.error('Error reviewing compliance report', error);
            next(error);
        }
    }
}

module.exports = new ComplianceController();
