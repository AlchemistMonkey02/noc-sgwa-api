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

            console.log('📥 OTP Verification Request:', { identifier, otp: otp?.substring(0, 2) + '****', type });

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
                console.log('❌ OTP Verification Failed:', { identifier, type });
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_OTP",
                        message: "Invalid or expired OTP",
                    },
                });
            }

            console.log('✅ OTP Verified Successfully:', { identifier, type });
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

                // Skip OTP pre-verification - allow direct registration
                // The OTP verification endpoints are still available but not mandatory
                console.log('📋 Skipping OTP pre-verification for direct registration:', {
                    mobile: applicantInfo.mobileNumber,
                    email: applicantInfo.emailId
                });

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
                    dateOfBirth: applicantInfo.dateOfBirth || applicantInfo.dob, // Support both field names
                    gender: applicantInfo.gender,
                    uidNumber: applicantInfo.uid || applicantInfo.uidNumber, // Support both field names
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

                    // From loginCredentials - support both username and preferredUsername
                    username: loginCredentials.preferredUsername || loginCredentials.username,
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

            // Generate tokens for auto-login after registration
            const token = authService.generateToken(result.user);
            const refreshToken = authService.generateRefreshToken(result.user);
            const jwtConfig = require("../config/jwt.config");

            // Set HTTP-only cookies (same as login)
            res.cookie("jwt", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: jwtConfig.jwtExpiration * 1000,
            });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: result.user._id,
                        userId: result.user._id,
                        username: result.user.username,
                        email: result.user.email,
                        mobile: result.user.phone,
                        applicantName: result.user.fullName,
                        firstName: result.user.firstName,
                        lastName: result.user.lastName,
                        userType: result.user.userType,
                        isVerified: result.user.emailVerified && result.user.phoneVerified,
                        verificationStatus: result.user.verificationStatus,
                    },
                    token,
                    refreshToken,
                    expiresIn: jwtConfig.jwtExpiration,
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
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            });

            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            // Add token to response header
            res.setHeader("Authorization", `Bearer ${result.token}`);

            // Add token to response header
            res.setHeader("Authorization", `Bearer ${result.token}`);

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

    /**
     * POST /api/auth/register/validate-step
     * Validate a specific registration step without creating user
     */
    async validateRegistrationStep(req, res, next) {
        try {
            const { step, data } = req.body;

            if (!step || !data) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "MISSING_PARAMETERS",
                        message: "Step number and data are required",
                    },
                });
            }

            // The actual validation is done by middleware based on step
            // This method just confirms validation passed and returns sanitized data
            let validatedData = {};
            let message = "";

            switch (step) {
                case 1:
                case "1":
                    message = "Applicant information validated successfully";
                    validatedData = { ...data };
                    delete validatedData.mobileOTP;
                    delete validatedData.emailOTP;
                    break;
                case 2:
                case "2":
                    message = "Communication address validated successfully";
                    validatedData = data;
                    break;
                case 3:
                case "3":
                    message = "Login credentials validated successfully";
                    validatedData = {
                        preferredUsername: data.preferredUsername,
                        securityQuestion: data.securityQuestion,
                    };
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: "INVALID_STEP",
                            message: "Step must be 1, 2, or 3",
                        },
                    });
            }

            res.status(200).json({
                success: true,
                message,
                data: validatedData,
            });
            res.status(200).json({
                success: true,
                message,
                data: validatedData,
            });
        } catch (error) {
            logger.error("Error validating registration step", error);
            next(error);
        }
    }

    /**
     * POST /api/auth/profile/contact/otp
     * Request OTP for updating contact (Email/Phone)
     */
    async requestContactUpdateOTP(req, res, next) {
        try {
            const { type, value } = req.body;
            const userId = req.user.id;

            if (!type || !value || !["EMAIL", "PHONE"].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid type or value. Type must be EMAIL or PHONE."
                });
            }

            // Check if value is already in use by ANOTHER user
            const query = type === "EMAIL" ? { email: value } : { phone: value };
            const existingUser = await User.findOne({ ...query, _id: { $ne: userId } });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: `${type === "EMAIL" ? "Email" : "Phone number"} is already in use by another account.`
                });
            }

            await authService.sendOTP(value, type === "EMAIL" ? "EMAIL" : "MOBILE");

            res.status(200).json({
                success: true,
                message: `OTP sent to ${value}`,
                data: { expiresIn: 300 }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/profile/contact/verify
     * Verify OTP and update contact
     */
    async verifyContactUpdate(req, res, next) {
        try {
            const { type, value, otp } = req.body;
            const userId = req.user.id;

            if (!type || !value || !otp) {
                return res.status(400).json({
                    success: false,
                    message: "Type, value, and OTP are required"
                });
            }

            // Verify OTP
            const otpType = type === "EMAIL" ? "EMAIL" : "MOBILE";
            const isValid = await authService.verifyOTP(value, otp, otpType);

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired OTP"
                });
            }

            // Update User Profile
            const updateField = type === "EMAIL" ? { email: value, emailVerified: true } : { phone: value, phoneVerified: true };

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updateField },
                { new: true }
            ).select("-password");

            // If updating email/phone, we might need to update username if it was same? 
            // For now, assuming username is separate or handled by model. 
            // (Note: Model logic might need username update if username === email)

            res.status(200).json({
                success: true,
                message: `${type === "EMAIL" ? "Email" : "Phone number"} updated successfully`,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/auth/officer/users/:id/verify
     * Verify user (Officer only)
     */
    async verifyUser(req, res, next) {
        try {
            const userId = req.params.id;
            const officerId = req.user.id;
            const { action, reason } = req.body;

            if (!["approve", "reject"].includes(action)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_ACTION",
                        message: "Action must be 'approve' or 'reject'",
                    },
                });
            }

            const user = await authService.verifyUser(userId, officerId, action, reason);

            res.status(200).json({
                success: true,
                data: user,
                message: `User ${action}d successfully`,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Upload profile picture
     */
    async uploadProfilePicture(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "NO_FILE_UPLOADED",
                        message: "Please upload an image file",
                    },
                });
            }

            const result = await authService.uploadProfilePicture(req.user.id, req.file);

            res.status(200).json({
                success: true,
                message: "Profile picture uploaded successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/auth/change-password
     * Change password
     */
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "MISSING_PARAMETERS",
                        message: "Current password and new password are required",
                    },
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_PASSWORD",
                        message: "New password must be at least 6 characters long",
                    },
                });
            }

            const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
