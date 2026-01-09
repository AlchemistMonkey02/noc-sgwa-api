const authService = require("./auth.service");
const logger = require("../utils/logger");
const User = require("./user.model");

class AuthController {
    /**
     * POST /api/auth/send-otp/mobile
     * Send OTP to mobile
     */
    async sendMobileOTP(req, res, next) {
        try {
            const { phone } = req.body;

            if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_PHONE",
                        message: "Please provide a valid 10-digit mobile number",
                    },
                });
            }

            await authService.sendOTP(phone, "MOBILE");

            res.status(200).json({
                success: true,
                message: "OTP sent successfully to your mobile number",
                data: { expiresIn: 300 },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/send-otp/email
     * Send OTP to email
     */
    async sendEmailOTP(req, res, next) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_EMAIL",
                        message: "Please provide a valid email address",
                    },
                });
            }

            await authService.sendOTP(email, "EMAIL");

            res.status(200).json({
                success: true,
                message: "OTP sent successfully to your email",
                data: { expiresIn: 300 },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/verify-otp
     * Verify OTP
     */
    async verifyOTP(req, res, next) {
        try {
            const { identifier, otp, type } = req.body;

            if (!identifier || !otp || !type) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "MISSING_PARAMETERS",
                        message: "Identifier, OTP, and type are required",
                    },
                });
            }

            const isValid = await authService.verifyOTP(identifier, otp, type);

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_OTP",
                        message: "Invalid or expired OTP",
                    },
                });
            }

            res.status(200).json({
                success: true,
                message: "OTP verified successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/auth/check-username/:username
     * Check username availability
     */
    async checkUsernameAvailability(req, res, next) {
        try {
            const { username } = req.params;

            if (!username || username.length < 4) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_USERNAME",
                        message: "Username must be at least 4 characters",
                    },
                });
            }

            const exists = await User.findOne({ username: username.toLowerCase() });

            res.status(200).json({
                success: true,
                available: !exists,
                message: exists ? "Username is already taken" : "Username is available",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/register
     * Register new user (supports both JSON and multipart with optional documents)
     * Supports CGWA BhuNeer format with nested structure
     */
    async register(req, res, next) {
        try {
            const loginInfo = {
                ipAddress: req.ip || req.connection.remoteAddress,
                deviceInfo: req.headers["user-agent"] || "Unknown",
            };

            // Handle both JSON and multipart requests
            let rawData;
            let documents = {};

            // Check if it's a multipart request (has files)
            if (req.files && Object.keys(req.files).length > 0) {
                // Multipart form-data request
                rawData = req.body.userData ? JSON.parse(req.body.userData) : req.body;

                // Get uploaded files
                if (req.files.idProofDocument) {
                    documents.ID_PROOF = req.files.idProofDocument[0];
                }
                if (req.files.AADHAR) {
                    documents.AADHAR = req.files.AADHAR[0];
                }
                if (req.files.ID_PROOF) {
                    documents.ID_PROOF = req.files.ID_PROOF[0];
                }
            } else {
                // Regular JSON request (no files)
                rawData = req.body;
            }

            // Transform CGWA BhuNeer format to flat structure if needed
            let userData;

            if (rawData.applicantInfo || rawData.communicationAddress || rawData.loginCredentials) {
                // CGWA BhuNeer format - transform to flat structure
                const { applicantInfo = {}, communicationAddress = {}, loginCredentials = {}, declaration } = rawData;

                // Verify OTPs before registration
                if (applicantInfo.mobileOTP) {
                    const mobileVerified = await authService.verifyOTP(
                        applicantInfo.mobileNumber,
                        applicantInfo.mobileOTP,
                        "MOBILE"
                    );
                    if (!mobileVerified) {
                        return res.status(400).json({
                            success: false,
                            error: {
                                code: "INVALID_OTP",
                                message: "Invalid or expired mobile OTP"
                            }
                        });
                    }
                }

                if (applicantInfo.emailOTP) {
                    const emailVerified = await authService.verifyOTP(
                        applicantInfo.emailId,
                        applicantInfo.emailOTP,
                        "EMAIL"
                    );
                    if (!emailVerified) {
                        return res.status(400).json({
                            success: false,
                            error: {
                                code: "INVALID_OTP",
                                message: "Invalid or expired email OTP"
                            }
                        });
                    }
                }

                // Check declaration
                if (!declaration) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: "DECLARATION_REQUIRED",
                            message: "Declaration is required"
                        }
                    });
                }

                userData = {
                    // From applicantInfo
                    title: applicantInfo.title,
                    firstName: applicantInfo.applicantName?.split(" ")[0] || applicantInfo.firstName,
                    lastName: applicantInfo.applicantName?.split(" ").slice(1).join(" ") || applicantInfo.lastName,
                    dateOfBirth: applicantInfo.dateOfBirth,
                    gender: applicantInfo.gender,
                    uidNumber: applicantInfo.uid,
                    idProofType: applicantInfo.idProofType,
                    idProofNumber: applicantInfo.idProofNumber,
                    phone: applicantInfo.mobileNumber,
                    phoneVerified: true, // OTP verified
                    email: applicantInfo.emailId,
                    emailVerified: true, // OTP verified

                    // From communicationAddress
                    communicationAddress: {
                        addressLine1: communicationAddress.addressLine1,
                        addressLine2: communicationAddress.addressLine2,
                        addressLine3: communicationAddress.addressLine3,
                        state: communicationAddress.state,
                        district: communicationAddress.district,
                        subDistrict: communicationAddress.subDistrict,
                        pincode: communicationAddress.pincode
                    },

                    // From loginCredentials
                    username: loginCredentials.preferredUsername,
                    password: loginCredentials.password,
                    securityQuestion: loginCredentials.securityQuestion,
                    securityAnswer: loginCredentials.securityAnswer,

                    // Default values
                    userType: rawData.userType || "APPLICANT",
                    verificationStatus: "PENDING"
                };
            } else {
                // Old format - use as is
                userData = rawData;
            }

            // Register user with or without documents
            let result;
            if (Object.keys(documents).length > 0) {
                // Has documents - use registerWithDocuments
                result = await authService.registerWithDocuments(userData, documents, loginInfo);
            } else {
                // No documents - regular registration
                result = await authService.register(userData, loginInfo);
            }

            res.status(201).json({
                success: true,
                data: {
                    userId: result.user._id,
                    username: result.user.username,
                    email: result.user.email,
                    mobile: result.user.phone,
                    applicantName: result.user.fullName,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    isVerified: result.user.emailVerified && result.user.phoneVerified,
                    verificationStatus: result.user.verificationStatus,
                    ...(result.documents && { documents: result.documents }),
                },
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/register-with-documents
     * DEPRECATED: Use /api/auth/register instead (supports optional documents)
     */
    async registerWithDocuments(req, res, next) {
        try {
            const loginInfo = {
                ipAddress: req.ip || req.connection.remoteAddress,
                deviceInfo: req.headers["user-agent"] || "Unknown",
            };

            // Parse form data
            const userData = JSON.parse(req.body.userData || "{}");

            // Get uploaded files
            const documents = {};
            if (req.files) {
                if (req.files.AADHAR) {
                    documents.AADHAR = req.files.AADHAR[0];
                }
                if (req.files.ID_PROOF) {
                    documents.ID_PROOF = req.files.ID_PROOF[0];
                }
            }

            const result = await authService.registerWithDocuments(userData, documents, loginInfo);

            res.status(201).json({
                success: true,
                data: {
                    userId: result.user._id,
                    email: result.user.email,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    documents: result.documents,
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
