const router = require('express').Router();
const queryController = require('./query.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// File upload config for query responses
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/queries/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'query-response-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, JPG/PNG and Word documents are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Public routes (no auth for now)

// User-specific routes
router.get('/user/all', authMiddleware.authenticate, queryController.getUserQueries);

// Application-specific routes
router.post('/applications/:applicationId/queries', authMiddleware.authenticate, queryController.raiseQuery);
router.get('/applications/:applicationId/queries', authMiddleware.authenticate, queryController.getQueries);

// Get query details
router.get('/:queryId', queryController.getQueryDetails);

// Reply to query (with optional file upload)
router.post('/:queryId/reply', authMiddleware.authenticate, upload.single('document'), queryController.replyToQuery);

// Close/resolve query (officer)
router.post('/:queryId/close', queryController.closeQuery);

module.exports = router;
