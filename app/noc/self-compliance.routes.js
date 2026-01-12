const router = require('express').Router();
const selfComplianceController = require('./self-compliance.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// File upload config (reuse from compliance.routes.js)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/compliance/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'self-compliance-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Routes are now public (no authentication required)

// Start compliance session
router.post('/start', selfComplianceController.startCompliance);

// Submit step data
router.post('/:id/step', selfComplianceController.submitStep);

// Upload documents
router.post('/:id/upload', upload.single('file'), selfComplianceController.uploadDocument);

// Final submission (with AI auto-validation)
router.post('/:id/submit', selfComplianceController.finalSubmit);

// Get status
router.get('/:id/status', selfComplianceController.getStatus);

module.exports = router;
