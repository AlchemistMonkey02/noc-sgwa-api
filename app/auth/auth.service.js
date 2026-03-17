const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("./user.model");
const OTP = require("./otp.model");
const jwtConfig = require("../config/jwt.config");
const emailService = require("../utils/email.service");
const notificationService = require("../notifications/notification.service");
const logger = require("../utils/logger");

class AuthService {
    /**
     * Send OTP for verification
     */
    async sendOTP(identifier, type) {
        try {
            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            // Delete any existing OTPs for this identifier
            await OTP.deleteMany({ identifier, type });

            // Save new OTP
            await OTP.create({
                identifier,
                type,
                otp,
                expiresAt,
            });

            // Send OTP
            if (type === "EMAIL") {
                // Log for now (TODO: integrate with email service)
                logger.info(`Email OTP for ${identifier}: ${otp}`);
                console.log("\n-------------------------------------------");
                console.log(`📧  EMAIL OTP FOR: ${identifier}`);
                console.log(`🔑  CODE: ${otp}`);
                console.log("-------------------------------------------\n");
            } else if (type === "MOBILE") {
                // Log for now (TODO: integrate SMS gateway)
                logger.info(`Mobile OTP for ${identifier}: ${otp}`);
                console.log("\n-------------------------------------------");
                console.log(`📱  MOBILE OTP FOR: ${identifier}`);
                console.log(`🔑  CODE: ${otp}`);
                console.log("-------------------------------------------\n");
            }

            return { success: true };
        } catch (error) {
            logger.error("Error sending OTP", error);
            throw error;
        }
    }

    /**
     * Verify OTP
     */
    async verifyOTP(identifier, otp, type) {
        try {
            // Support for default testing OTP
            if (otp === "1234") {
                console.log(`⚡ Using bypass OTP 1234 for ${identifier}`);
                
                // Keep record for checkPreVerified
                await OTP.updateOne(
                    { identifier, type },
                    { verified: true, otp: "1234", expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
                    { upsert: true }
                );

                // Update user verification status if user exists
                if (type === "EMAIL") {
                    await User.updateOne({ email: identifier }, { emailVerified: true });
                } else if (type === "MOBILE") {
                    await User.updateOne({ phone: identifier }, { phoneVerified: true });
                }
                return true;
            }

            if (!otpRecord) {
                console.log(`❌ No active OTP record found for ${identifier}`);
                return false;
            }

            // Check if expired
            if (otpRecord.expiresAt < new Date()) {
                await OTP.deleteOne({ _id: otpRecord._id });
                return false;
            }

            // Check attempts
            if (otpRecord.attempts >= 3) {
                await OTP.deleteOne({ _id: otpRecord._id });
                throw {
                    statusCode: 429,
                    message: "Too many failed attempts. Please request a new OTP.",
                };
            }

            // Verify OTP
            if (otpRecord.otp !== otp) {
                otpRecord.attempts += 1;
                await otpRecord.save();
                return false;
            }

            // Mark as verified
            otpRecord.verified = true;
            await otpRecord.save();

            // Update user verification status if user exists
            if (type === "EMAIL") {
                await User.updateOne({ email: identifier }, { emailVerified: true });
            } else if (type === "MOBILE") {
                await User.updateOne({ phone: identifier }, { phoneVerified: true });
            }

            return true;
        } catch (error) {
            logger.error("Error verifying OTP", error);
            throw error;
        }
    }

    /**
     * Check if identifier was pre-verified (for registration)
     * Checks for verified OTP within last 30 minutes
     */
    async checkPreVerified(identifier, type) {
        try {
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

            const verifiedOTP = await OTP.findOne({
                identifier,
                type,
                verified: true,
                updatedAt: { $gte: thirtyMinutesAgo }
            });

            console.log('📊 checkPreVerified result:', {
                identifier,
                type,
                found: !!verifiedOTP,
                otpData: verifiedOTP ? { verified: verifiedOTP.verified, updatedAt: verifiedOTP.updatedAt } : null
            });

            return !!verifiedOTP;
        } catch (error) {
            logger.error("Error checking pre-verified status", error);
            return false;
        }
    }

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

            // Determine account status based on user role
            const officerRoles = ["DGO", "SGWA", "RSGWA", "ENFORCEMENT", "INSPECTION"];
            const assignedUserType = userData.userType || "APPLICANT";
            const initialAccountStatus = officerRoles.includes(assignedUserType) ? "INACTIVE" : "ACTIVE";

            // Create new user
            const user = new User({
                ...userData,
                password: hashedPassword,
                userType: assignedUserType,
                accountStatus: initialAccountStatus,
            });

            await user.save();

            logger.info(`New user registered: ${user.email}`, { userId: user._id });

            // Send welcome email (async, don't wait)
            // Send welcome notification (email + sms + whatsapp)
            notificationService.send(user._id, 'USER_REGISTERED', {
                applicationNumber: 'N/A', // No app yet
                message: 'Welcome to SGWA Portal!'
            });

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
     * Register new user with documents
     */
    async registerWithDocuments(userData, documents, loginInfo = {}) {
        try {
            // First, register the user
            const result = await this.register(userData, loginInfo);
            const userId = result.user._id;

            // Save uploaded documents
            const Document = require("../documents/document.model");
            const savedDocuments = [];

            for (const [documentType, file] of Object.entries(documents)) {
                if (file) {
                    const document = new Document({
                        userId,
                        documentType,
                        fileName: file.filename,
                        originalName: file.originalname,
                        filePath: file.path,
                        mimeType: file.mimetype,
                        fileSize: file.size,
                        uploadedAt: new Date(),
                    });

                    await document.save();
                    savedDocuments.push({
                        documentType,
                        documentId: document._id,
                        fileName: document.fileName,
                    });

                    // Update user's idProofDocument field if it's ID proof
                    if (documentType === "AADHAR" || documentType === "ID_PROOF") {
                        await User.findByIdAndUpdate(userId, {
                            idProofDocument: document._id,
                        });
                    }
                }
            }

            logger.info(`Documents uploaded for user: ${result.user.email}`, {
                userId,
                documentCount: savedDocuments.length,
            });

            return {
                ...result,
                documents: savedDocuments,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Login user
     */
    async login(username, password, userType, loginInfo = {}) {
        try {
            // Find user by email, phone, or username
            const user = await User.findOne({
                $or: [
                    { email: username },
                    { phone: username },
                    { username: username.toLowerCase() },
                ],
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
            // Send login notification
            notificationService.send(user._id, 'LOGIN', loginInfo);

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
    async forgotPassword(data) {
        try {
            const { email, userId, mobileNumber, userType } = data;
            
            // Find user by multiple fields for security
            const user = await User.findOne({ 
                email: email.toLowerCase(),
                username: userId,
                phone: mobileNumber,
                userType: userType
            });

            if (!user) {
                // Return generic error for security (don't reveal which field failed)
                throw {
                    statusCode: 404,
                    code: "USER_NOT_FOUND",
                    message: "User not found with provided information.",
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
                message: "Password reset link has been sent to your registered email address.",
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

            // Fetch Company Details
            const Company = require("../company/company.model");
            const company = await Company.findOne({ userId });

            return {
                ...user.toObject(),
                companyId: company ? company._id : null,
                company: company || null
            };
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
    /**
     * Verify user (Officer only)
     */
    async verifyUser(userId, officerId, action, reason = null) {
        try {
            const update = {
                verificationStatus: action === "approve" ? "VERIFIED" : "REJECTED",
                // Optionally update account status based on verification
                accountStatus: action === "approve" ? "ACTIVE" : "INACTIVE",
            };

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: update },
                { new: true }
            ).select("-password");

            if (!user) {
                throw {
                    statusCode: 404,
                    code: "USER_NOT_FOUND",
                    message: "User not found",
                };
            }

            logger.info(`User ${action}d: ${user.email}`, {
                userId: user._id,
                officerId,
                action
            });

            // Send notification email
            // emailService.sendVerificationStatus(user, action, reason).catch(...)

            return user;
        } catch (error) {
            throw error;
        }
    }
    async uploadProfilePicture(userId, file) {
        try {
            // Upload using document service
            // Note: We use existing document service but might want to add PROFILE_PICTURE to enum later if strict
            // For now, we can use "OTHER" or check if document service supports generic uploads
            // The document model has "OTHER", let's use that or update enum if needed.
            // Actually, let's look at document.service.js usage.
            // But wait, the user model references ProfilePicture as a Document.

            const documentService = require("../documents/document.service");

            // Upload as a document
            // We need to wrap single file in array as per documentService.uploadDocuments expectation
            const uploadedDocs = await documentService.uploadDocuments(
                [file],
                userId,
                null, // No company ID linked directly here, checking if optional
                "OTHER" // Using OTHER for now or we could add PROFILE_PICTURE to enum
            );

            if (!uploadedDocs || uploadedDocs.length === 0) {
                throw {
                    statusCode: 500,
                    message: "Failed to upload profile picture"
                };
            }

            const docId = uploadedDocs[0].documentId; // Use Public UUID
            const mongoId = uploadedDocs[0]._id;
            const filePath = uploadedDocs[0].filePath; // Get file path from document service response

            // Update user profile
            await User.findByIdAndUpdate(userId, {
                profilePicture: mongoId
            });

            // Read file and convert to base64
            const fs = require('fs');
            const fileBuffer = fs.readFileSync(filePath);
            const mimeType = uploadedDocs[0].mimeType;
            const base64Image = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

            return {
                profilePicture: docId,
                base64: base64Image,
                url: `/api/documents/${docId}/view`,
                downloadUrl: `/api/documents/${docId}/download`
            };
        } catch (error) {
            logger.error("Error uploading profile picture", error);
            throw error;
        }
    }

    /**
     * Upload digital signature
     */
    async uploadSignature(userId, file) {
        try {
            const documentService = require("../documents/document.service");

            // Upload as a document
            // Wraps single file in array
            const uploadedDocs = await documentService.uploadDocuments(
                [file],
                userId,
                null,
                "OTHER" // Using OTHER for signature
            );

            if (!uploadedDocs || uploadedDocs.length === 0) {
                throw {
                    statusCode: 500,
                    message: "Failed to upload digital signature"
                };
            }

            const docId = uploadedDocs[0].documentId;
            const mongoId = uploadedDocs[0]._id;
            const filePath = uploadedDocs[0].filePath;

            // Update user profile with signature
            await User.findByIdAndUpdate(userId, {
                signature: mongoId
            });

            // Read file and convert to base64 for immediate feedback
            const fs = require('fs');
            const fileBuffer = fs.readFileSync(filePath);
            const mimeType = uploadedDocs[0].mimeType;
            const base64Image = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

            return {
                signature: docId,
                base64: base64Image,
                url: `/api/documents/${docId}/view`,
                downloadUrl: `/api/documents/${docId}/download`
            };
        } catch (error) {
            logger.error("Error uploading digital signature", error);
            throw error;
        }
    }
    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await User.findById(userId);

            if (!user) {
                throw {
                    statusCode: 404,
                    code: "USER_NOT_FOUND",
                    message: "User not found",
                };
            }

            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                throw {
                    statusCode: 400,
                    code: "INVALID_PASSWORD",
                    message: "Current password is incorrect",
                };
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();

            logger.info(`Password changed for user: ${user.email}`, { userId: user._id });

            // Send notification email (async)
            /* emailService.sendPasswordChangeNotification({
                firstName: user.firstName,
                email: user.email 
            }).catch(err => logger.error("Password change notification failed", err)); */

            return { message: "Password changed successfully" };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Approve officer registration (Super Admin only)
     */
    async approveOfficer(officerId, adminId) {
        try {
            const officer = await User.findById(officerId);

            if (!officer) {
                throw {
                    statusCode: 404,
                    code: "USER_NOT_FOUND",
                    message: "Officer not found",
                };
            }

            const officerRoles = ["DGO", "SGWA", "RSGWA", "ENFORCEMENT", "INSPECTION"];
            if (!officerRoles.includes(officer.userType)) {
                throw {
                    statusCode: 400,
                    code: "INVALID_OPERATION",
                    message: "User is not an officer",
                };
            }

            officer.accountStatus = "ACTIVE";
            officer.verificationStatus = "VERIFIED";
            await officer.save();

            // Notify officer
            notificationService.send(officer._id, 'ACCOUNT_APPROVED', {
                applicationNumber: 'N/A',
                message: 'Your officer account has been approved by the Super Admin.'
            }).catch(err => logger.error("Account approval notification failed", err));

            return officer;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AuthService();
