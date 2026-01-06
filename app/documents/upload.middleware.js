const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Allowed file types
const ALLOWED_MIME_TYPES = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/jpg": [".jpg"],
};

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create upload path: uploads/{userId}/{documentType}/
        const userId = req.user.id;
        const documentType = file.fieldname || "OTHER";
        const uploadPath = path.join("uploads", userId, documentType);

        // Create directory if it doesn't exist
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: {documentType}-{timestamp}-{uuid}.{ext}
        const documentType = file.fieldname || "document";
        const timestamp = Date.now();
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname).toLowerCase();

        const filename = `${documentType}-${timestamp}-${uniqueId}${ext}`;
        cb(null, filename);
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    // Check MIME type
    const allowedExtensions = ALLOWED_MIME_TYPES[file.mimetype];

    if (!allowedExtensions) {
        return cb(
            new Error(
                `Invalid file type. Allowed types: PDF, JPG, JPEG, PNG. Received: ${file.mimetype}`
            ),
            false
        );
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
        return cb(
            new Error(
                `Invalid file extension. Expected ${allowedExtensions.join(", ")} but got ${ext}`
            ),
            false
        );
    }

    cb(null, true);
};

// Multer configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});

// Error handler middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                error: {
                    code: "FILE_TOO_LARGE",
                    message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
                },
            });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
                success: false,
                error: {
                    code: "UNEXPECTED_FIELD",
                    message: "Unexpected file field",
                },
            });
        }
    }

    if (err) {
        return res.status(400).json({
            success: false,
            error: {
                code: "FILE_UPLOAD_ERROR",
                message: err.message || "File upload failed",
            },
        });
    }

    next();
};

module.exports = {
    upload,
    handleMulterError,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
};
