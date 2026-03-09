// Bulk document verification service
const NOCApplication = require('../noc/noc-application.model');
const logger = require('../utils/logger');

class BulkDocVerificationService {
    /**
     * Verify multiple documents at once
     */
    async verifyMultipleDocuments(documentIds, officerId, officerRole, verificationData) {
        try {
            const results = [];

            // Map role to verification field
            const roleMap = {
                'DGO': 'dgo',
                'SGWA': 'sgwa',
                'ENFORCEMENT': 'enforcement'
            };

            const verificationRole = roleMap[officerRole];
            if (!verificationRole) {
                throw {
                    statusCode: 403,
                    code: 'INVALID_ROLE',
                    message: 'Invalid role for document verification'
                };
            }

            for (const documentId of documentIds) {
                try {
                    // Find application containing this document
                    const application = await NOCApplication.findOne({
                        'documents.documentId': documentId
                    });

                    if (!application) {
                        results.push({
                            documentId,
                            success: false,
                            error: 'Document not found'
                        });
                        continue;
                    }

                    // Find the specific document
                    const document = application.documents.find(doc => doc.documentId === documentId);

                    if (!document) {
                        results.push({
                            documentId,
                            success: false,
                            error: 'Document not found'
                        });
                        continue;
                    }

                    // Initialize verification object if needed
                    if (!document.verification) {
                        document.verification = {
                            dgo: { status: 'PENDING', verified: false },
                            sgwa: { status: 'PENDING', verified: false },
                            enforcement: { status: 'PENDING', verified: false }
                        };
                    }

                    // Update verification for this role
                    document.verification[verificationRole] = {
                        verified: verificationData.status === 'APPROVED',
                        verifiedBy: officerId,
                        verifiedAt: new Date(),
                        remarks: verificationData.remarks || '',
                        status: verificationData.status || 'APPROVED'
                    };

                    // Update legacy isVerified if all three approved
                    const allApproved =
                        document.verification.dgo.status === 'APPROVED' &&
                        document.verification.sgwa.status === 'APPROVED' &&
                        document.verification.enforcement.status === 'APPROVED';

                    document.isVerified = allApproved;
                    document.remarks = verificationData.remarks;

                    // Use updateOne to avoid full document validation
                    await NOCApplication.updateOne(
                        { 'documents.documentId': documentId },
                        {
                            $set: {
                                'documents.$': document
                            }
                        },
                        { runValidators: false }
                    );

                    results.push({
                        documentId,
                        documentType: document.documentType,
                        success: true,
                        status: verificationData.status
                    });

                } catch (error) {
                    results.push({
                        documentId,
                        success: false,
                        error: error.message
                    });
                }
            }

            logger.info(`Bulk verification by ${officerRole}`, {
                officerId,
                totalDocuments: documentIds.length,
                successCount: results.filter(r => r.success).length
            });

            return {
                totalDocuments: documentIds.length,
                successCount: results.filter(r => r.success).length,
                failedCount: results.filter(r => !r.success).length,
                results
            };
        } catch (error) {
            logger.error('Error in bulk document verification', error);
            throw error;
        }
    }
}

module.exports = new BulkDocVerificationService();
