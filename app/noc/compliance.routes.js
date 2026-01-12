const router = require('express').Router();
const complianceController = require('./compliance.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/compliance/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'compliance-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// All routes require authentication
router.use(authMiddleware.authenticate);

// Search application/NOC
router.get('/search', complianceController.searchApplication);

// Get NOC details
router.get('/:nocId/details', complianceController.getNOCDetails);

// Submit compliance report
router.post('/compliance/submit', upload.single('reportFile'), complianceController.submitReport);

// Get compliance history
router.get('/:nocId/compliance/history', complianceController.getHistory);

// Update compliance report
router.put('/compliance/:reportId', upload.single('reportFile'), complianceController.updateReport);

// Delete compliance report
router.delete('/compliance/:reportId', complianceController.deleteReport);

// Officer: Review compliance report
router.post('/compliance/:reportId/review', complianceController.reviewComplianceReport);

module.exports = router;
