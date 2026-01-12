const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const ApplicationQuery = require('./application-query.model');
const NOCApplication = require('./noc-application.model');
const logger = require('../utils/logger');

class QueryController {
    /**
     * POST /api/applications/:applicationId/queries
     * Officer raises a query against an application
     */
    async raiseQuery(req, res, next) {
        try {
            const { applicationId } = req.params;
            const { subject, query } = req.body;

            if (!subject || !query) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Subject and query are required'
                    }
                });
            }

            // Find application
            const queryCriteria = [
                { applicationId: applicationId },
                { applicationNumber: applicationId }
            ];

            if (mongoose.Types.ObjectId.isValid(applicationId)) {
                queryCriteria.push({ _id: applicationId });
            }

            const application = await NOCApplication.findOne({
                $or: queryCriteria
            });

            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'APPLICATION_NOT_FOUND',
                        message: 'Application not found'
                    }
                });
            }

            // Create query
            const queryId = uuidv4();
            const newQuery = await ApplicationQuery.create({
                queryId,
                applicationId: application._id,
                subject,
                query,
                raisedBy: req.user?.id || null, // Officer ID
                status: 'OPEN'
            });

            // Update application status to indicate query raised
            application.status = application.status.includes('QUERY')
                ? application.status
                : `QUERY_RAISED_${application.status.split('_')[1] || 'DGO'}`;
            await application.save({ validateBeforeSave: false });

            res.status(201).json({
                success: true,
                data: {
                    queryId: newQuery.queryId,
                    subject: newQuery.subject,
                    query: newQuery.query,
                    status: newQuery.status,
                    raisedAt: newQuery.raisedAt
                },
                message: 'Query raised successfully'
            });
        } catch (error) {
            logger.error('Error raising query', error);
            next(error);
        }
    }

    /**
     * GET /api/applications/:applicationId/queries
     * Get all queries for an application
     */
    async getQueries(req, res, next) {
        try {
            const { applicationId } = req.params;
            const { status } = req.query;

            // Find application
            const queryCriteria = [
                { applicationId: applicationId },
                { applicationNumber: applicationId }
            ];

            if (mongoose.Types.ObjectId.isValid(applicationId)) {
                queryCriteria.push({ _id: applicationId });
            }

            const application = await NOCApplication.findOne({
                $or: queryCriteria
            });

            if (!application) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'APPLICATION_NOT_FOUND',
                        message: 'Application not found'
                    }
                });
            }

            const filter = { applicationId: application._id };
            if (status) {
                filter.status = status;
            }

            const queries = await ApplicationQuery.find(filter)
                .populate('raisedBy', 'firstName lastName email')
                .populate('respondedBy', 'firstName lastName')
                .sort({ raisedAt: -1 });

            const pendingCount = await ApplicationQuery.countDocuments({
                applicationId: application._id,
                status: 'OPEN'
            });

            const resolvedCount = await ApplicationQuery.countDocuments({
                applicationId: application._id,
                status: 'CLOSED'
            });

            res.status(200).json({
                success: true,
                data: {
                    applicationId: application.applicationId,
                    applicationNumber: application.applicationNumber,
                    pendingQueriesCount: pendingCount,
                    resolvedQueriesCount: resolvedCount,
                    queries: queries.map(q => ({
                        queryId: q.queryId,
                        subject: q.subject,
                        query: q.query,
                        status: q.status,
                        raisedBy: q.raisedBy ? {
                            name: `${q.raisedBy.firstName} ${q.raisedBy.lastName}`,
                            email: q.raisedBy.email
                        } : null,
                        raisedAt: q.raisedAt,
                        response: q.response,
                        responseDocument: q.responseDocument,
                        respondedBy: q.respondedBy ? `${q.respondedBy.firstName} ${q.respondedBy.lastName}` : null,
                        respondedAt: q.respondedAt
                    }))
                }
            });
        } catch (error) {
            logger.error('Error getting queries', error);
            next(error);
        }
    }

    /**
     * GET /api/queries/:queryId
     * Get query details
     */
    async getQueryDetails(req, res, next) {
        try {
            const { queryId } = req.params;

            const query = await ApplicationQuery.findOne({ queryId })
                .populate('applicationId', 'applicationNumber applicationId')
                .populate('raisedBy', 'firstName lastName email')
                .populate('respondedBy', 'firstName lastName');

            if (!query) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'QUERY_NOT_FOUND',
                        message: 'Query not found'
                    }
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    queryId: query.queryId,
                    applicationId: query.applicationId?.applicationId,
                    applicationNumber: query.applicationId?.applicationNumber,
                    subject: query.subject,
                    query: query.query,
                    status: query.status,
                    raisedBy: query.raisedBy ? {
                        name: `${query.raisedBy.firstName} ${query.raisedBy.lastName}`,
                        email: query.raisedBy.email
                    } : null,
                    raisedAt: query.raisedAt,
                    response: query.response,
                    responseDocument: query.responseDocument,
                    respondedBy: query.respondedBy ? `${query.respondedBy.firstName} ${query.respondedBy.lastName}` : null,
                    respondedAt: query.respondedAt
                }
            });
        } catch (error) {
            logger.error('Error getting query details', error);
            next(error);
        }
    }

    /**
     * POST /api/queries/:queryId/reply
     * User replies to a query
     */
    async replyToQuery(req, res, next) {
        try {
            const { queryId } = req.params;
            const { response } = req.body;

            if (!response) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Response is required'
                    }
                });
            }

            const query = await ApplicationQuery.findOne({ queryId });

            if (!query) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'QUERY_NOT_FOUND',
                        message: 'Query not found'
                    }
                });
            }

            if (query.status === 'CLOSED') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'QUERY_ALREADY_CLOSED',
                        message: 'This query has already been closed'
                    }
                });
            }

            // Handle file upload if present
            if (req.file) {
                query.responseDocument = {
                    fileName: req.file.originalname,
                    filePath: `/uploads/queries/${req.file.filename}`,
                    uploadedAt: new Date()
                };
            }

            query.response = response;
            query.respondedBy = req.user?.id || null;
            query.respondedAt = new Date();
            query.status = 'RESPONDED';

            await query.save();

            res.status(200).json({
                success: true,
                data: {
                    queryId: query.queryId,
                    response: query.response,
                    responseDocument: query.responseDocument,
                    status: query.status,
                    respondedAt: query.respondedAt
                },
                message: 'Reply submitted successfully'
            });
        } catch (error) {
            logger.error('Error replying to query', error);
            next(error);
        }
    }

    /**
     * POST /api/queries/:queryId/close
     * Officer closes/resolves a query
     */
    async closeQuery(req, res, next) {
        try {
            const { queryId } = req.params;
            const { remarks } = req.body;

            const query = await ApplicationQuery.findOne({ queryId });

            if (!query) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'QUERY_NOT_FOUND',
                        message: 'Query not found'
                    }
                });
            }

            query.status = 'CLOSED';
            if (remarks) {
                query.response = query.response
                    ? `${query.response}\n\nOfficer Remarks: ${remarks}`
                    : `Officer Remarks: ${remarks}`;
            }

            await query.save();

            res.status(200).json({
                success: true,
                data: {
                    queryId: query.queryId,
                    status: query.status
                },
                message: 'Query closed successfully'
            });
        } catch (error) {
            logger.error('Error closing query', error);
            next(error);
        }
    }
}

module.exports = new QueryController();
