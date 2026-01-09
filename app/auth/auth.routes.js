const router = require("express").Router();
const authController = require("./auth.controller");
const authValidator = require("./auth.validator");
const authMiddleware = require("../middleware/auth.middleware");
const { registrationUpload } = require("./registration-upload.middleware");

// OTP & Verification endpoints
router.post("/send-otp/mobile", authController.sendMobileOTP);
router.post("/send-otp/email", authController.sendEmailOTP);
router.post("/verify-otp", authController.verifyOTP);

// Username availability check
router.get("/check-username/:username", authController.checkUsernameAvailability);

// Registration - supports both JSON and multipart (with optional document uploads)
router.post(
    "/register",
    registrationUpload.fields([
        { name: "idProofDocument", maxCount: 1 }, // CGWA BhuNeer format
        { name: "AADHAR", maxCount: 1 },
        { name: "ID_PROOF", maxCount: 1 },
    ]),
    authController.register
);

// Login
router.post("/login", authValidator.validateLogin, authController.login);

// Protected routes
router.use(authMiddleware.authenticate);

router.post("/logout", authController.logout);
router.post("/refresh", authController.refreshToken);
router.get("/profile", authController.getProfile);
router.put("/profile", authController.updateProfile);

// Password management
router.post("/forgot-password", authValidator.validateForgotPassword, authController.forgotPassword);
router.post("/reset-password", authValidator.validateResetPassword, authController.resetPassword);

module.exports = router;
