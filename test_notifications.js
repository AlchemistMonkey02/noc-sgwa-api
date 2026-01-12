require('dotenv').config();
const notificationService = require('./app/notifications/notification.service');
const mongoose = require('mongoose');

// Mock external services to enable testing without DB/Sms provider
const smsService = require('./app/notifications/sms.service');
const whatsappService = require('./app/notifications/whatsapp.service');
const emailService = require('./app/utils/email.service');

// Mock implementations
smsService.sendNotification = async (data) => {
    console.log(`[MOCK] SMS Sent: ${data.event} to ${data.user.phone} with message: "${smsService.formatMessage(data.event, data)}"`);
    return { success: true };
};

whatsappService.sendNotification = async (data) => {
    // We want to see the formatted message or template data
    const messageOrTemplate = whatsappService.formatMessage(data.event, data);
    console.log(`[MOCK] WhatsApp Sent: ${data.event} to ${data.user.phone} with body/template:`, JSON.stringify(messageOrTemplate, null, 2));
    return { success: true };
};

emailService.sendNotification = async (event, user, data) => {
    console.log(`[MOCK] Email Sent: ${event} to ${user.email}`);
    return { success: true };
};

// Mock User Model for notification creation
const User = require('./app/auth/user.model');
User.findById = async (id) => {
    return {
        _id: id,
        firstName: 'Test',
        lastName: 'User',
        email: 'applicant@test.com',
        phone: '9876543210'
    };
};

// Mock Notification Model
const Notification = require('./app/notifications/notification.model');
Notification.create = async (data) => {
    console.log(`[MOCK] DB Notification Created: ${data.title} - ${data.message}`);
    return data;
};

// Mock Notification Creation to avoid DB connection
notificationService.createNotification = async (userId, data) => {
    console.log(`[MOCK] DB Notification Created: ${data.title} - ${data.message}`);
    return data;
};


async function test() {
    console.log('--- Testing Notification System with Templates ---');

    const validId = '507f1f77bcf86cd799439011'; // Valid hex string

    // Test Case 1: Application Submitted
    await notificationService.send(validId, 'APPLICATION_SUBMITTED', {
        applicationNumber: 'NOC-2025-001',
        projectName: 'Green Valley Resort',
        submittedDate: new Date()
    });

    // Test Case 2: DGO Approved
    await notificationService.send(validId, 'DGO_APPROVED', {
        applicationNumber: 'NOC-2025-001',
        projectName: 'Green Valley Resort'
    });

    // Test Case 3: Inspection
    await notificationService.send(validId, 'INSPECTION_SCHEDULED', {
        applicationNumber: 'NOC-2025-001',
        projectName: 'Green Valley Resort'
    });

    console.log('--- Test Complete ---');
}

test();
