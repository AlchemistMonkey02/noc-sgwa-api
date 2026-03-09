const Document = require('./document.model');
const NOCApplication = require('../noc/noc-application.model');
const logger = require('../utils/logger');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
            const document = await Document.findOne({ documentId });

            if (!document) {
                throw { statusCode: 404, message: "Document not found" };
            }

            const absolutePath = path.resolve(document.filePath);
            if (!fs.existsSync(absolutePath)) {
                logger.error(`Physical file missing for AI verification: ${absolutePath}`);
                throw { statusCode: 404, message: "Physical file not found on server" };
            }

            // Construct form data for AI service
            // Note: Since form-data might not be in package.json, we use native stream and headers
            const FormData = require('form-data'); // Usually available in Node environments or as sub-dep
            const form = new FormData();
            form.append('file', fs.createReadStream(absolutePath));
            form.append('documentType', document.documentType || 'OTHER');

            // Add metadata if available (using application info)
            const application = await NOCApplication.findOne({ 'documents.documentId': documentId });
            if (application) {
                const metadata = {
                    applicantName: application.projectDetails?.applicantName,
                    applicationNumber: application.applicationNumber
                };
                form.append('inputText', JSON.stringify(metadata));
            }

            logger.info(`Triggering real AI verification for ${documentId} (${document.documentType})`);

            const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://ocr.geoplanetsolution.in';
            const response = await axios.post(`${aiServiceUrl}/verify-document`, form, {
                headers: {
                    ...form.getHeaders()
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            if (response.data) {
                const aiResult = response.data;
                const verificationResult = {
                    verified: aiResult.success && (aiResult.verified || aiResult.valid),
                    confidence: aiResult.confidence || 0.9,
                    remarks: aiResult.remarks || (aiResult.success ? "AI Verified" : "AI Verification Failed"),
                    extractedText: aiResult.extracted_text || aiResult.text
                };

                return await this.updateVerificationStatus(documentId, verificationResult);
            } else {
                throw new Error("AI Service returned empty response");
            }

        } catch (error) {
            logger.error('Error performing AI verification:', error.message);
            throw error;
        }
    }
}

module.exports = new AIVerificationService();
