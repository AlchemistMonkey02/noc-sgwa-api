const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    notificationId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    type: {
        type: String,
        enum: [
            'APPLICATION_SUBMITTED',
            'STATUS_UPDATE',
            'QUERY_RAISED',
            'QUERY_RESPONDED',
            'INSPECTION_SCHEDULED',
            'PAYMENT_RECEIVED',
            'NOC_ISSUED',
            'NOC_EXPIRING',
            'DOCUMENT_VERIFIED',
            'DOCUMENT_REJECTED',
            'USER_REGISTERED',
            'LOGIN',
            'SYSTEM',
            'PASSWORD_RESET'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    relatedEntity: {
        entityType: {
            type: String,
            enum: ['APPLICATION', 'CERTIFICATE', 'PAYMENT', 'DOCUMENT']
        },
        entityId: String
    },
    actionUrl: String, // Deep link to relevant page
    isRead: {
        type: Boolean,
        default: false,
    },
    readAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    }
}, {
    timestamps: true
});

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

module.exports = mongoose.model('Notification', NotificationSchema);
