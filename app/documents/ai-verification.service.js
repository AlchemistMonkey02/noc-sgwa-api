const Document = require('./document.model');
const NOCApplication = require('../noc/noc-application.model');
const logger = require('../utils/logger');

class AIVerificationService {
    /**
     * Update AI verification status for a document
     * @param {string} documentId - The UUID of the document
     * @param {Object} verificationData - { verified, confidence, remarks }
     */
    async updateVerificationStatus(documentId, verificationData) {
        try {
            const { verified, confidence, remarks } = verificationData;

            // 1. Update the Document collection
            const document = await Document.findOne({ documentId });

            if (!document) {
                logger.warn(`Document not found for AI verification: ${documentId}`);
                // Proceed to try finding it in NOCApplication even if not in Document collection (embedded pattern)
            } else {
                document.verification.ai = {
                    verified: verified === true,
                    confidence: confidence || 0,
                    remarks: remarks || '',
                    verifiedAt: new Date(),
                    status: verified ? 'APPROVED' : 'REJECTED'
                };
                await document.save();
            }

            // 2. Update the embedded document in NOCApplication
            const application = await NOCApplication.findOne({
                'documents.documentId': documentId
            });

            if (application) {
                const embeddedDoc = application.documents.find(d => d.documentId === documentId);
                if (embeddedDoc) {
                    if (!embeddedDoc.verification) embeddedDoc.verification = {};
                    embeddedDoc.verification.ai = {
                        verified: verified === true,
                        confidence: confidence || 0,
                        remarks: remarks || '',
                        verifiedAt: new Date(),
                        status: verified ? 'APPROVED' : 'REJECTED'
                    };

                    // We use updateOne with $set to update just the specific array element
                    // to avoid validation issues on the whole document
                    await NOCApplication.updateOne(
                        { 'documents.documentId': documentId },
                        { $set: { 'documents.$': embeddedDoc } },
                        { runValidators: false }
                    );
                    logger.info(`AI Verification updated for embedded document ${documentId}`);
                }
            } else {
                logger.warn(`No application found containing document ${documentId}`);
            }

            return { success: true, documentId };

        } catch (error) {
            logger.error('Error in AI verification service:', error);
            throw error;
        }
    }
    /**
     * Trigger the actual AI verification process
     * @param {string} documentId 
     */
    async performVerification(documentId) {
        try {
            const Document = require('./document.model');
            const document = await Document.findOne({ documentId });

            if (!document) {
                throw { statusCode: 404, message: "Document not found" };
            }

            // TODO: Call actual Python/AI Service here
            // const aiResponse = await axios.post('http://localhost:8000/verify', { file: document.filePath ... })

            // For now, SIMULATE the AI response for demonstration
            logger.info(`Simulating AI verification for ${documentId}`);

            const isMockValid = Math.random() > 0.2; // 80% pass rate
            const mockResult = {
                verified: isMockValid,
                confidence: parseFloat((0.8 + Math.random() * 0.19).toFixed(2)),
                remarks: isMockValid ? "Document verified successfully (AI)" : "Document unclear or invalid (AI)"
            };

            // Reuse the existing update method logic
            return await this.updateVerificationStatus(documentId, mockResult);

        } catch (error) {
            logger.error('Error performing AI verification:', error);
            throw error;
        }
    }
}

module.exports = new AIVerificationService();
