const aiVerificationService = require('./ai-verification.service');
const logger = require('../utils/logger');

class AIVerificationController {
    async verifyDocument(req, res) {
        try {
            const { documentId } = req.params;
            const { verified, confidence, remarks } = req.body;

            if (verified === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Missing 'verified' boolean in body"
                });
            }

            const result = await aiVerificationService.updateVerificationStatus(documentId, {
                verified,
                confidence,
                remarks
            });

            return res.status(200).json({
                success: true,
                data: result,
                message: "AI Verification status updated"
            });

        } catch (error) {
            logger.error('Controller Error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }
}

module.exports = new AIVerificationController();
