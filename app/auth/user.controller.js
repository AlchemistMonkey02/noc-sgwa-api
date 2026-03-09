const User = require("./user.model");
const logger = require("../utils/logger");

class UserController {
    /**
     * GET /api/users
     * Get all users with optional filtering
     */
    async getUsers(req, res, next) {
        try {
            const { userType, role, search } = req.query;
            const query = {};

            // Filter by Role/UserType
            if (userType) query.userType = userType;
            if (role) query.userType = role;

            // Search by name or email
            if (search) {
                const searchRegex = new RegExp(search, 'i');
                query.$or = [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { email: searchRegex },
                    { username: searchRegex }
                ];
            }

            // Execute query
            const users = await User.find(query)
                .select("-password -__v -securityQuestion -securityAnswer")
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                data: {
                    count: users.length,
                    users: users
                },
                message: "Users retrieved successfully"
            });
        } catch (error) {
            logger.error("Error fetching users", error);
            next(error);
        }
    }
}

module.exports = new UserController();
