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

// NEW: Validate individual registration steps
router.post(
    "/register/validate-step",
    (req, res, next) => {
        const step = req.body.step;
        if (step === 1 || step === "1") {
            return authValidator.validateStep1(req, res, next);
        } else if (step === 2 || step === "2") {
            return authValidator.validateStep2(req, res, next);
        } else if (step === 3 || step === "3") {
            return authValidator.validateStep3(req, res, next);
        }
        next();
    },
    authController.validateRegistrationStep
);

// Login
router.post("/login", authValidator.validateLogin, authController.login);

// Protected routes
router.use(authMiddleware.authenticate);

router.post("/logout", authController.logout);
router.post("/change-password", authController.changePassword);
router.post("/refresh", authController.refreshToken);
router.get("/profile", authController.getProfile);
router.put("/profile", authController.updateProfile);
router.post(
    "/profile-picture",
    registrationUpload.single("profilePicture"),
    authController.uploadProfilePicture
);

router.post(
    "/profile/signature",
    registrationUpload.single("signature"),
    authController.uploadSignature
);

// Contact Update (Email/Phone) with OTP
router.post("/profile/contact/otp", authController.requestContactUpdateOTP);
router.post("/profile/contact/verify", authController.verifyContactUpdate);

// Password management
router.post("/forgot-password", authValidator.validateForgotPassword, authController.forgotPassword);
router.post("/reset-password", authValidator.validateResetPassword, authController.resetPassword);

// Officer Routes
router.put(
    "/officer/users/:id/verify",
    authMiddleware.authorize(["DGO", "SGWA", "ENFORCEMENT"]),
    authController.verifyUser
);

// Admin / Super Admin Routes
router.put(
    "/admin/officers/:id/approve",
    authMiddleware.authorize(["ADMIN", "SUPER_ADMIN"]),
    authController.approveOfficer
);

module.exports = router;
