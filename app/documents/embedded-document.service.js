// Service to verify embedded documents in NOC application
const NOCApplication = require('../noc/noc-application.model');
const logger = require('../utils/logger');

class EmbeddedDocumentService {
    /**
     * Verify an embedded document by documentId with three-way approval
     */
    async verifyEmbeddedDocument(trackingId, documentId, officerId, officerRole, verificationData) {
        try {
            // Find application by tracking ID
            const application = await NOCApplication.findOne({ trackingId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: 'APPLICATION_NOT_FOUND',
                    message: 'Application not found'
                };
            }

            // Find the document in the embedded array
            const document = application.documents.find(doc => doc.documentId === documentId);

            if (!document) {
                throw {
                    statusCode: 404,
                    code: 'DOCUMENT_NOT_FOUND',
                    message: 'Document not found in application'
                };
            }

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

            // Initialize verification object if it doesn't exist
            if (!document.verification) {
                document.verification = {
                    dgo: { status: 'PENDING', verified: false },
                    sgwa: { status: 'PENDING', verified: false },
                    enforcement: { status: 'PENDING', verified: false }
                };
            }

            // Update verification for specific role
            document.verification[verificationRole] = {
                verified: verificationData.status === 'APPROVED',
                verifiedBy: officerId,
                verifiedAt: new Date(),
                remarks: verificationData.remarks || '',
                status: verificationData.status || 'APPROVED'
            };

            // Update legacy field for backward compatibility
            if (verificationData.status === 'APPROVED') {
                document.isVerified = true;
            } else if (verificationData.status === 'REJECTED') {
                document.isVerified = false;
            }

            // Save the application
            await application.save();

            logger.info(`Embedded document verified by ${officerRole}`, {
                trackingId,
                documentId,
                officerId,
                status: verificationData.status
            });

            return {
                document,
                message: `Document ${verificationData.status.toLowerCase()} by ${officerRole}`
            };
        } catch (error) {
            logger.error('Error verifying embedded document', error);
            throw error;
        }
    }

    /**
     * Get verification status for all documents in an application
     */
    async getDocumentVerificationStatus(trackingId) {
        try {
            const application = await NOCApplication.findOne({ trackingId });

            if (!application) {
                throw {
                    statusCode: 404,
                    code: 'APPLICATION_NOT_FOUND',
                    message: 'Application not found'
                };
            }

            return application.documents.map(doc => ({
                documentId: doc.documentId,
                documentType: doc.documentType,
                fileName: doc.fileName,
                verification: doc.verification || {
                    dgo: { status: 'PENDING', verified: false },
                    sgwa: { status: 'PENDING', verified: false },
                    enforcement: { status: 'PENDING', verified: false }
                }
            }));
        } catch (error) {
            logger.error('Error getting document verification status', error);
            throw error;
        }
    }
}

module.exports = new EmbeddedDocumentService();
