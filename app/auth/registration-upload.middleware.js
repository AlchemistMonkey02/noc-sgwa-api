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

// Storage for registration (before user exists)
const registrationStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Temporary upload path for registration
        const tempId = `temp_${Date.now()}`;
        const documentType = file.fieldname || "OTHER";
        const uploadPath = path.join("uploads", "temp", tempId, documentType);

        // Create directory if it doesn't exist
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const documentType = file.fieldname || "document";
        const timestamp = Date.now();
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname).toLowerCase();

        const filename = `${documentType}_${timestamp}_${uniqueId}${ext}`;
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

// Upload for registration (no authentication required)
const registrationUpload = multer({
    storage: registrationStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});

module.exports = {
    registrationUpload,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
};
