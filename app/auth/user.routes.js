const router = require("express").Router();
const userController = require("./user.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Protect all routes
router.use(authMiddleware.authenticate);

/**
 * GET /api/users
 * Search and List Users
 * Restricted to Admins and Officers
 */
router.get("/",
    authMiddleware.authorize("DGO", "RSGWA", "ENFORCEMENT", "ADMIN"),
    userController.getUsers
);

module.exports = router;
