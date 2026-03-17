// Simplified embedded document verification service
const NOCApplication = require('../noc/noc-application.model');
const logger = require('../utils/logger');

class SimpleDocVerificationService {
    /**
     * Verify document by passing documentId in body
     */
    async verifyDocument(documentId, officerId, officerRole, verificationData) {
        try {
            // Find application containing this document
            const application = await NOCApplication.findOne({
                'documents.documentId': documentId
            });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: 'DOCUMENT_NOT_FOUND',
                    message: 'Document not found'
                };
            }

            // Find the specific document
            const document = application.documents.find(doc => doc.documentId === documentId);

            if (!document) {
                throw {
                    statusCode: 404,
                    code: 'DOCUMENT_NOT_FOUND',
                    message: 'Document not found'
                };
            }

            // Map role to verification field
            const roleMap = {
                'DGO': 'dgo',
                'SGWA': 'sgwa',
                'RSGWA': 'sgwa',
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

            logger.info(`Document verified by ${officerRole}`, {
                documentId,
                officerId,
                status: verificationData.status
            });

            return document;
        } catch (error) {
            logger.error('Error verifying document', error);
            throw error;
        }
    }
}

module.exports = new SimpleDocVerificationService();
