const authService = require("./auth.service");
const logger = require("../utils/logger");

class AuthController {
    /**
     * POST /api/auth/register
     * Register new user
     */
    async register(req, res, next) {
        try {
            const loginInfo = {
                ipAddress: req.ip || req.connection.remoteAddress,
                deviceInfo: req.headers["user-agent"] || "Unknown",
            };

            const result = await authService.register(req.body, loginInfo);

            res.status(201).json({
                success: true,
                data: {
                    userId: result.user._id,
                    email: result.user.email,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                },
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/login
     * Login user
     */
    async login(req, res, next) {
        try {
            const { username, password, userType } = req.body;

            const loginInfo = {
                ipAddress: req.ip || req.connection.remoteAddress,
                deviceInfo: req.headers["user-agent"] || "Unknown",
                loginTime: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
                location: "India", // Can integrate IP geolocation service
            };

            const result = await authService.login(username, password, userType, loginInfo);

            // Set HTTP-only cookie
            res.cookie("jwt", result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: result.expiresIn * 1000,
            });

            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: result.user._id,
                        email: result.user.email,
                        firstName: result.user.firstName,
                        lastName: result.user.lastName,
                        userType: result.user.userType,
                        organizationName: result.user.organizationName,
                    },
                    token: result.token,
                    refreshToken: result.refreshToken,
                    expiresIn: result.expiresIn,
                },
                message: "Login successful",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/logout
     * Logout user
     */
    async logout(req, res, next) {
        try {
            // Clear cookies
            res.cookie("jwt", "", {
                httpOnly: true,
                expires: new Date(0),
            });

            res.cookie("refreshToken", "", {
                httpOnly: true,
                expires: new Date(0),
            });

            res.status(200).json({
                success: true,
                message: "Logout successful",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/refresh
     * Refresh access token
     */
    async refreshToken(req, res, next) {
        try {
            const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: "INVALID_TOKEN",
                        message: "Refresh token is required",
                    },
                });
            }

            const result = await authService.refreshToken(refreshToken);

            // Update cookie
            res.cookie("jwt", result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: result.expiresIn * 1000,
            });

            res.status(200).json({
                success: true,
                data: {
                    token: result.token,
                    expiresIn: result.expiresIn,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/forgot-password
     * Request password reset
     */
    async forgotPassword(req, res, next) {
        try {
            const result = await authService.forgotPassword(req.body.email);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/reset-password
     * Reset password using token
     */
    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            const result = await authService.resetPassword(token, newPassword);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/users/profile
     * Get user profile
     */
    async getProfile(req, res, next) {
        try {
            const user = await authService.getProfile(req.user.id);

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/users/profile
     * Update user profile
     */
    async updateProfile(req, res, next) {
        try {
            const user = await authService.updateProfile(req.user.id, req.body);

            res.status(200).json({
                success: true,
                data: user,
                message: "Profile updated successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
