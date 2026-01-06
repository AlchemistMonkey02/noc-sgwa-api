const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt.config");
const User = require("../auth/user.model");
const logger = require("../utils/logger");

/**
 * Authenticate JWT token
 */
exports.authenticate = async (req, res, next) => {
    try {
        // Get token from header or cookie
        let token = null;

        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Please login to access this resource",
                },
            });
        }

        // Verify token
        const decoded = jwt.verify(token, jwtConfig.secret);

        // Get user from token
        const user = await User.findById(decoded.id).select("-password -resetPasswordToken -resetPasswordExpire");

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "USER_NOT_FOUND",
                    message: "User associated with this token no longer exists",
                },
            });
        }

        // Check if account is active
        if (user.accountStatus !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                error: {
                    code: "ACCOUNT_INACTIVE",
                    message: `Your account is ${user.accountStatus.toLowerCase()}`,
                },
            });
        }

        // Attach user to request
        req.user = {
            id: user._id,
            email: user.email,
            userType: user.userType,
            firstName: user.firstName,
            lastName: user.lastName,
        };

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_TOKEN",
                    message: "Invalid authentication token",
                },
            });
        }

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                error: {
                    code: "TOKEN_EXPIRED",
                    message: "Authentication token has expired. Please login again.",
                },
            });
        }

        logger.error("Authentication error", error);
        res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Authentication failed",
            },
        });
    }
};

/**
 * Authorize specific user types
 */
exports.authorize = (...allowedTypes) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message: "Please login first",
                },
            });
        }

        if (!allowedTypes.includes(req.user.userType)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED_ACCESS",
                    message: "You do not have permission to access this resource",
                },
            });
        }

        next();
    };
};
