/**
 * Centralized Notification Templates
 * 
 * Defines message content for SMS, WhatsApp, and Email subjects.
 * 
 * Placeholders:
 * {{applicationNumber}} - Application Reference Number
 * {{projectName}} - Name of the project
 * {{otp}} - One Time Password
 * {{validity}} - Validity period
 * {{deadline}} - Response deadline
 */

const TEMPLATES = {
    // Auth Events
    USER_REGISTERED: {
        email: {
            subject: "Welcome to SGWA Portal - Registration Successful",
            templateFile: "welcome.html"
        }
    },
    OTP: {
        email: {
            subject: "SGWA Verification Code",
            templateFile: "otp.html"
        }
    },
    LOGIN: {
        email: {
            subject: "New Login to Your SGWA Account",
            templateFile: "login-notification.html"
        }
    },

    // Application Events
    APPLICATION_SUBMITTED: {
        email: {
            subject: "Application Submitted - {{applicationNumber}}",
            templateFile: "application-submitted.html"
        }
    },

    // DGO Events
    DGO_APPROVED: {
        email: {
            subject: "Application Approved by District Officer",
            templateFile: "application-approved.html",
            extraData: { authorityName: "District Groundwater Officer" }
        }
    },
    DGO_REJECTED: {
        email: {
            subject: "Application Rejected by District Officer",
            templateFile: "application-rejected.html"
        }
    },
    DGO_QUERY_RAISED: {
        email: {
            subject: "Query Raised by District Officer",
            templateFile: "query-raised.html"
        }
    },

    // SGWA Events
    SGWA_APPROVED: {
        email: {
            subject: "Application Approved by SGWA",
            templateFile: "application-approved.html",
            extraData: { authorityName: "SGWA Technical Committee" }
        }
    },
    SGWA_REJECTED: {
        email: {
            subject: "Application Rejected by SGWA",
            templateFile: "application-rejected.html"
        }
    },
    SGWA_QUERY_RAISED: {
        email: {
            subject: "Query Raised by SGWA",
            templateFile: "query-raised.html"
        }
    },

    // Enforcement / Final Events
    INSPECTION_SCHEDULED: {
        email: {
            subject: "Site Inspection Scheduled",
            templateFile: "inspection-scheduled.html"
        }
    },
    NOC_ISSUED: {
        email: {
            subject: "NOC Certificate Issued",
            templateFile: "noc-issued.html"
        }
    },
    ENFORCEMENT_REJECTED: {
        email: {
            subject: "Application Rejected by Enforcement Wing",
            templateFile: "application-rejected.html"
        }
    },

    // Default Fallback
    DEFAULT: {
        email: {
            subject: "Notification from SGWA",
            templateFile: "generic-notification.html"
        }
    }
};

module.exports = TEMPLATES;
