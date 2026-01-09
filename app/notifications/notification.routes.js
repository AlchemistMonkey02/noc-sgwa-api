const router = require('express').Router();
const notificationController = require('./notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware.authenticate);

// GET /api/notifications - Get user notifications
router.get('/', notificationController.getNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', notificationController.markAsRead);

// PUT /api/notifications/mark-all-read - Mark all as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
