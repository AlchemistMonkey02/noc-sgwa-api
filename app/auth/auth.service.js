const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("./user.model");
const jwtConfig = require("../config/jwt.config");
const emailService = require("../utils/email.service");
const logger = require("../utils/logger");

class AuthService {
    /**
     * Register new user
     */
    async register(userData, loginInfo = {}) {
        try {
            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email: userData.email }, { phone: userData.phone }],
            });

            if (existingUser) {
                if (existingUser.email === userData.email) {
                    throw {
                        statusCode: 400,
                        code: "DUPLICATE_ENTRY",
                        message: "Email is already registered",
                    };
                }
                throw {
                    statusCode: 400,
                    code: "DUPLICATE_ENTRY",
                    message: "Phone number is already registered",
                };
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Create new user
            const user = new User({
                ...userData,
                password: hashedPassword,
                userType: userData.userType || "APPLICANT",
            });

            await user.save();

            logger.info(`New user registered: ${user.email}`, { userId: user._id });

            // Send welcome email (async, don't wait)
            emailService.sendWelcomeEmail({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.email,
            }).catch((err) => logger.error("Welcome email failed", err));

            // Return user without password
            const userObject = user.toObject();
            delete userObject.password;

            return {
                user: userObject,
                message: "Registration successful! Please check your email for further instructions.",
            };
        } catch (error) {
            if (error.code === 11000) {
                // MongoDB duplicate key error
                const field = Object.keys(error.keyPattern)[0];
                throw {
                    statusCode: 400,
                    code: "DUPLICATE_ENTRY",
                    message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already registered`,
                };
            }
            throw error;
        }
    }

    /**
     * Login user
     */
    async login(username, password, userType, loginInfo = {}) {
        try {
            // Find user by email or phone
            const user = await User.findOne({
                $or: [{ email: username }, { phone: username }],
            });

            if (!user) {
                throw {
                    statusCode: 401,
                    code: "AUTHENTICATION_FAILED",
                    message: "Invalid credentials",
                };
            }

            // Check user type if specified
            if (userType && user.userType !== userType) {
                throw {
                    statusCode: 403,
                    code: "UNAUTHORIZED_ACCESS",
                    message: `This login portal is for ${userType} users only`,
                };
            }

            // Check account status
            if (user.accountStatus !== "ACTIVE") {
                throw {
                    statusCode: 403,
                    code: "ACCOUNT_INACTIVE",
                    message: `Your account is ${user.accountStatus.toLowerCase()}. Please contact support.`,
                };
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw {
                    statusCode: 401,
                    code: "AUTHENTICATION_FAILED",
                    message: "Invalid credentials",
                };
            }

            // Update last login
            user.lastLogin = new Date();
            user.loginCount = (user.loginCount || 0) + 1;
            await user.save();

            // Generate JWT token
            const token = this.generateToken(user);
            const refreshToken = this.generateRefreshToken(user);

            logger.info(`User logged in: ${user.email}`, {
                userId: user._id,
                ip: loginInfo.ipAddress,
            });

            // Send login notification email (async, don't wait)
            emailService.sendLoginNotification(
                {
                    firstName: user.firstName,
                    email: user.email,
                },
                loginInfo
            ).catch((err) => logger.error("Login notification failed", err));

            // Return user without password
            const userObject = user.toObject();
            delete userObject.password;
            delete userObject.resetPasswordToken;
            delete userObject.resetPasswordExpire;

            return {
                user: userObject,
                token,
                refreshToken,
                expiresIn: jwtConfig.jwtExpiration,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate JWT access token
     */
    generateToken(user) {
        return jwt.sign(
            {
                id: user._id,
                email: user.email,
                userType: user.userType,
            },
            jwtConfig.secret,
            {
                expiresIn: jwtConfig.jwtExpiration,
            }
        );
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(user) {
        return jwt.sign(
            {
                id: user._id,
                type: "refresh",
            },
            jwtConfig.refreshSecret || jwtConfig.secret,
            {
                expiresIn: jwtConfig.refreshExpiration || "7d",
            }
        );
    }

    /**
     * Verify and refresh token
     */
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(
                refreshToken,
                jwtConfig.refreshSecret || jwtConfig.secret
            );

            if (decoded.type !== "refresh") {
                throw { statusCode: 401, message: "Invalid refresh token" };
            }

            const user = await User.findById(decoded.id);
            if (!user || user.accountStatus !== "ACTIVE") {
                throw { statusCode: 401, message: "User not found or inactive" };
            }

            const newToken = this.generateToken(user);
            const newRefreshToken = this.generateRefreshToken(user);

            return {
                token: newToken,
                refreshToken: newRefreshToken,
                expiresIn: jwtConfig.jwtExpiration,
            };
        } catch (error) {
            throw {
                statusCode: 401,
                code: "INVALID_TOKEN",
                message: "Invalid or expired refresh token",
            };
        }
    }

    /**
     * Forgot password - generate reset token
     */
    async forgotPassword(email) {
        try {
            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                // Don't reveal if email exists
                return {
                    message: "If the email exists, a password reset link has been sent.",
                };
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString("hex");
            const hashedToken = crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
            await user.save();

            logger.info(`Password reset requested: ${user.email}`, { userId: user._id });

            // Send reset email (async)
            emailService.sendPasswordReset(user, resetToken).catch((err) =>
                logger.error("Password reset email failed", err)
            );

            return {
                message: "If the email exists, a password reset link has been sent.",
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reset password using token
     */
    async resetPassword(token, newPassword) {
        try {
            const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

            const user = await User.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpire: { $gt: Date.now() },
            });

            if (!user) {
                throw {
                    statusCode: 400,
                    code: "INVALID_TOKEN",
                    message: "Invalid or expired reset token",
                };
            }

            // Hash new password
            user.password = await bcrypt.hash(newPassword, 10);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            logger.info(`Password reset successful: ${user.email}`, { userId: user._id });

            return {
                message: "Password reset successful. You can now login with your new password.",
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user profile
     */
    async getProfile(userId) {
        try {
            const user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpire");

            if (!user) {
                throw {
                    statusCode: 404,
                    code: "USER_NOT_FOUND",
                    message: "User not found",
                };
            }

            return user;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, updateData) {
        try {
            // Don't allow updating certain fields
            delete updateData.email;
            delete updateData.password;
            delete updateData.userType;
            delete updateData.verificationStatus;
            delete updateData.accountStatus;

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).select("-password -resetPasswordToken -resetPasswordExpire");

            if (!user) {
                throw {
                    statusCode: 404,
                    code: "USER_NOT_FOUND",
                    message: "User not found",
                };
            }

            logger.info(`Profile updated: ${user.email}`, { userId: user._id });

            return user;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AuthService();
