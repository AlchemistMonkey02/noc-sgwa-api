const router = require("express").Router();
const authController = require("./auth.controller");
const authValidator = require("./auth.validator");
const authMiddleware = require("../middleware/auth.middleware");

// Public routes
router.post("/register", authValidator.validateRegister, authController.register);

router.post("/login", authValidator.validateLogin, authController.login);

router.post("/logout", authController.logout);

router.post("/refresh", authController.refreshToken);

router.post(
    "/forgot-password",
    authValidator.validateForgotPassword,
    authController.forgotPassword
);

router.post(
    "/reset-password",
    authValidator.validateResetPassword,
    authController.resetPassword
);

// Protected routes (require authentication)
router.get("/profile", authMiddleware.authenticate, authController.getProfile);

router.put(
    "/profile",
    authMiddleware.authenticate,
    authValidator.validateUpdateProfile,
    authController.updateProfile
);

module.exports = router;
