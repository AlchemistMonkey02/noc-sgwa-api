# Enhanced Features - Backend API Documentation
## SGWA NOC Portal - Enhanced Modules API Specification

> **Version:** 2.0  
> **Last Updated:** January 2026  
> **Base URL:** `https://api.sgwa.rajasthan.gov.in/v1`

This document covers the backend APIs required for the enhanced dashboard features based on CGWA Bhuneer portal.

---

## Table of Contents

1. [Account Settings APIs](#1-account-settings-apis)
2. [Self Compliance APIs](#2-self-compliance-apis)
3. [Query Management APIs](#3-query-management-apis)
4. [EAC Module APIs](#4-eac-module-apis)
5. [Issue Reporting APIs](#5-issue-reporting-apis)
6. [Payment Details APIs](#6-payment-details-apis)
7. [Charge Revision APIs](#7-charge-revision-apis)
8. [Reports Module APIs](#8-reports-module-apis)
9. [Utility Tools APIs](#9-utility-tools-apis)
10. [Help Center APIs](#10-help-center-apis)

---

## 1. Account Settings APIs

### 1.1 Get User Profile

**Endpoint:** `GET /users/profile`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "USR2026001234",
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "email": "rajesh.kumar@example.com",
    "phone": "+91-9876543210",
    "phoneVerified": true,
    "emailVerified": true,
    "profilePhoto": "https://cdn.sgwa.gov.in/profiles/user123.jpg",
    "organizationName": "ABC Industries Ltd.",
    "organizationType": "COMPANY",
    "designation": "Manager",
    "panNumber": "ABCDE1234F",
    "gstNumber": "22ABCDE1234F1Z5",
    "address": {
      "line1": "Plot No. 123, Industrial Area",
      "line2": "Near ABC Road",
      "city": "Jaipur",
      "state": "Rajasthan",
      "district": "Jaipur",
      "pincode": "302001"
    },
    "accountStatus": "ACTIVE",
    "twoFactorEnabled": false,
    "createdAt": "2025-06-15T10:30:00Z",
    "lastLogin": "2026-01-08T09:15:00Z"
  }
}
```

**PowerShell Test:**
```powershell
$token = "your_jwt_token_here"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Uri "https://api.sgwa.rajasthan.gov.in/v1/users/profile" `
    -Method Get -Headers $headers

$response | ConvertTo-Json -Depth 10
```

---

### 1.2 Update User Profile

**Endpoint:** `PUT /users/profile`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "phone": "+91-9876543210",
  "designation": "Senior Manager",
  "organizationName": "ABC Industries Ltd.",
  "address": {
    "line1": "Plot No. 123, Industrial Area",
    "line2": "Near ABC Road",
    "city": "Jaipur",
    "state": "Rajasthan",
    "district": "Jaipur",
    "pincode": "302001"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": "USR2026001234",
    "updatedAt": "2026-01-08T10:30:00Z"
  }
}
```

**PowerShell Test:**
```powershell
$body = @{
    firstName = "Rajesh"
    lastName = "Kumar"
    phone = "+91-9876543210"
    designation = "Senior Manager"
    organizationName = "ABC Industries Ltd."
    address = @{
        line1 = "Plot No. 123, Industrial Area"
        line2 = "Near ABC Road"
        city = "Jaipur"
        state = "Rajasthan"
        district = "Jaipur"
        pincode = "302001"
    }
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://api.sgwa.rajasthan.gov.in/v1/users/profile" `
    -Method Put -Headers $headers -Body $body

$response | ConvertTo-Json
```

---

### 1.3 Upload Profile Photo

**Endpoint:** `POST /users/profile/photo`

**Headers:** 
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Request Body:** FormData with `photo` file

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile photo uploaded successfully",
  "data": {
    "photoUrl": "https://cdn.sgwa.gov.in/profiles/user123.jpg",
    "uploadedAt": "2026-01-08T10:30:00Z"
  }
}
```

---

### 1.4 Change Password

**Endpoint:** `POST /users/profile/change-password`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@456",
  "confirmPassword": "NewPassword@456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Current password incorrect
- `400 Bad Request` - New password doesn't meet requirements
- `400 Bad Request` - Passwords don't match

**PowerShell Test:**
```powershell
$body = @{
    currentPassword = "OldPassword@123"
    newPassword = "NewPassword@456"
    confirmPassword = "NewPassword@456"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://api.sgwa.rajasthan.gov.in/v1/users/profile/change-password" `
    -Method Post -Headers $headers -Body $body

$response | ConvertTo-Json
```

---

### 1.5 Enable/Disable Two-Factor Authentication

**Endpoint:** `POST /users/profile/2fa/toggle`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "enable": true,
  "password": "UserPassword@123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Two-factor authentication enabled",
  "data": {
    "qrCode": "data:image/png;base64,...",
    "secretKey": "JBSWY3DPEHPK3PXP"
  }
}
```

---

### 1.6 Get Login History

**Endpoint:** `GET /users/profile/login-history`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "loginHistory": [
      {
        "loginId": "LOGIN001",
        "loginTime": "2026-01-08T09:15:00Z",
        "ipAddress": "103.45.67.89",
        "device": "Chrome 120 on Windows 10",
        "location": "Jaipur, Rajasthan",
        "status": "SUCCESS"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 47,
      "limit": 10
    }
  }
}
```

---

## 2. Self Compliance APIs

### 2.1 Get Compliance Dashboard

**Endpoint:** `GET /compliance/dashboard`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequirements": 12,
      "completed": 8,
      "pending": 3,
      "overdue": 1
    },
    "upcomingDeadlines": [
      {
        "complianceId": "COMP2026001",
        "type": "QUARTERLY_REPORT",
        "title": "Q4 2025 Water Extraction Report",
        "dueDate": "2026-01-15",
        "daysRemaining": 7,
        "status": "PENDING"
      }
    ],
    "recentSubmissions": [
      {
        "submissionId": "SUB2026001",
        "complianceType": "METER_READING",
        "submittedDate": "2026-01-05",
        "status": "APPROVED",
        "officerRemarks": "Approved. All readings are within limits."
      }
    ],
    "activeNOCs": [
      {
        "nocNumber": "RJ/NOC/2024/001234",
        "validFrom": "2024-06-01",
        "validUpto": "2027-05-31",
        "complianceFrequency": "QUARTERLY"
      }
    ]
  }
}
```

**PowerShell Test:**
```powershell
$response = Invoke-RestMethod -Uri "https://api.sgwa.rajasthan.gov.in/v1/compliance/dashboard" `
    -Method Get -Headers $headers

$response | ConvertTo-Json -Depth 10
```

---

### 2.2 Get Compliance Requirements

**Endpoint:** `GET /compliance/requirements`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `nocNumber` (optional): Filter by NOC
- `status` (optional): PENDING, COMPLETED, OVERDUE

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "requirements": [
      {
        "requirementId": "REQ2026001",
        "nocNumber": "RJ/NOC/2024/001234",
        "type": "QUARTERLY_REPORT",
        "title": "Quarterly Water Extraction Report - Q4 2025",
        "description": "Submit water extraction data for October-December 2025",
        "dueDate": "2026-01-15",
        "frequency": "QUARTERLY",
        "status": "PENDING",
        "requiredDocuments": [
          "Water meter readings",
          "Piezometer data",
          "Photo evidence of meter"
        ],
        "lastSubmissionDate": "2025-10-10"
      }
    ]
  }
}
```

---

### 2.3 Submit Compliance Report

**Endpoint:** `POST /compliance/submit`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "requirementId": "REQ2026001",
  "nocNumber": "RJ/NOC/2024/001234",
  "reportingPeriod": {
    "startDate": "2025-10-01",
    "endDate": "2025-12-31"
  },
  "waterExtractionData": {
    "totalExtraction": 125000,
    "unit": "m³",
    "dailyAverage": 1358.7,
    "peakExtraction": 1850
  },
  "meterReadings": [
    {
      "meterId": "MTR001",
      "meterType": "FLOW_METER",
      "openingReading": 500000,
      "closingReading": 625000,
      "totalExtraction": 125000,
      "unit": "m³",
      "meterPhotoDocId": "DOC2026001"
    }
  ],
  "piezometerData": [
    {
      "piezometerId": "PIEZO001",
      "location": "North Well",
      "waterLevel": 45.5,
      "unit": "meters below ground level",
      "measurementDate": "2025-12-31",
      "remarks": "Stable water level"
    }
  ],
  "rainwaterHarvesting": {
    "implemented": true,
    "capacity": 50000,
    "unit": "liters",
    "rechargeVolume": 35000
  },
  "remarks": "All operations within approved limits",
  "documents": ["DOC2026001", "DOC2026002", "DOC2026003"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Compliance report submitted successfully",
  "data": {
    "submissionId": "SUB2026015",
    "submittedDate": "2026-01-08T10:30:00Z",
    "status": "SUBMITTED",
    "acknowledgementUrl": "/compliance/submissions/SUB2026015/acknowledgement"
  }
}
```

**PowerShell Test:**
```powershell
$body = @{
    requirementId = "REQ2026001"
    nocNumber = "RJ/NOC/2024/001234"
    reportingPeriod = @{
        startDate = "2025-10-01"
        endDate = "2025-12-31"
    }
    waterExtractionData = @{
        totalExtraction = 125000
        unit = "m³"
        dailyAverage = 1358.7
        peakExtraction = 1850
    }
    meterReadings = @(
        @{
            meterId = "MTR001"
            meterType = "FLOW_METER"
            openingReading = 500000
            closingReading = 625000
            totalExtraction = 125000
            unit = "m³"
            meterPhotoDocId = "DOC2026001"
        }
    )
    remarks = "All operations within approved limits"
    documents = @("DOC2026001", "DOC2026002")
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "https://api.sgwa.rajasthan.gov.in/v1/compliance/submit" `
    -Method Post -Headers $headers -Body $body

$response | ConvertTo-Json
```

---

### 2.4 Get Compliance History

**Endpoint:** `GET /compliance/history`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `nocNumber` (optional)
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD
- `page` (default: 1)
- `limit` (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "submissionId": "SUB2026001",
        "nocNumber": "RJ/NOC/2024/001234",
        "complianceType": "QUARTERLY_REPORT",
        "reportingPeriod": "Q3 2025 (Jul-Sep)",
        "submittedDate": "2025-10-10",
        "status": "APPROVED",
        "reviewedBy": "Dr. Sharma (DGO)",
        "reviewedDate": "2025-10-15",
        "remarks": "Approved. All parameters within limits."
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalRecords": 28,
      "limit": 10
    }
  }
}
```

---

## 3. Query Management APIs

### 3.1 Get Query Inbox

**Endpoint:** `GET /queries/inbox`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `status` (optional): PENDING, RESPONDED, RESOLVED, CLOSED
- `applicationId` (optional): Filter by specific application
- `page` (default: 1)
- `limit` (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 15,
      "pending": 3,
      "responded": 8,
      "resolved": 4
    },
    "queries": [
      {
        "queryId": "QRY2026001",
        "applicationId": "NOC2024001",
        "applicationNumber": "RJ/NOC/2024/001234",
        "queryType": "DOCUMENT_CLARIFICATION",
        "subject": "Clarification required on land ownership documents",
        "raisedBy": {
          "name": "Dr. Rajesh Sharma",
          "designation": "District Groundwater Officer",
          "office": "Jaipur District"
        },
        "raisedDate": "2026-01-05T10:30:00Z",
        "responseDeadline": "2026-01-12T23:59:59Z",
        "daysRemaining": 4,
        "priority": "MEDIUM",
        "status": "PENDING",
        "unread": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalRecords": 15,
      "limit": 10
    }
  }
}
```

**PowerShell Test:**
```powershell
$response = Invoke-RestMethod -Uri "https://api.sgwa.rajasthan.gov.in/v1/queries/inbox?status=PENDING" `
    -Method Get -Headers $headers

$response | ConvertTo-Json -Depth 10
```

---

### 3.2 Get Query Details

**Endpoint:** `GET /queries/{queryId}`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "queryId": "QRY2026001",
    "applicationId": "NOC2024001",
    "applicationNumber": "RJ/NOC/2024/001234",
    "projectName": "Industrial Water Supply Project",
    "queryType": "DOCUMENT_CLARIFICATION",
    "subject": "Clarification required on land ownership documents",
    "description": "The land ownership certificate submitted shows Plot No. 123, but the project location mentions Plot No. 124. Please clarify and submit correct documents.",
    "raisedBy": {
      "officerId": "OFF001",
      "name": "Dr. Rajesh Sharma",
      "designation": "District Groundwater Officer",
      "office": "Jaipur District",
      "email": "dgo.jaipur@sgwa.raj.gov.in",
      "phone": "+91-141-2234567"
    },
    "raisedDate": "2026-01-05T10:30:00Z",
    "responseDeadline": "2026-01-12T23:59:59Z",
    "priority": "MEDIUM",
    "status": "PENDING",
    "attachments": [
      {
        "documentId": "DOC001",
        "fileName": "highlighted_issue.pdf",
        "fileUrl": "https://cdn.sgwa.gov.in/queries/doc001.pdf"
      }
    ],
    "responseHistory": [],
    "remarks": "Please respond within 7 days to avoid application delay"
  }
}
```

---

### 3.3 Submit Query Response

**Endpoint:** `POST /queries/{queryId}/respond`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "response": "Thank you for pointing out the discrepancy. The correct plot number is 123. Plot no. 124 was mentioned in error in the location description. I have attached the corrected project location document along with a clarification letter.",
  "documents": ["DOC2026010", "DOC2026011"],
  "requestReview": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Response submitted successfully",
  "data": {
    "queryId": "QRY2026001",
    "responseId": "RESP2026001",
    "submittedDate": "2026-01-08T11:00:00Z",
    "status": "RESPONDED",
    "nextAction": "Awaiting officer review"
  }
}
```

**PowerShell Test:**
```powershell
$body = @{
    response = "Thank you for pointing out the discrepancy..."
    documents = @("DOC2026010", "DOC2026011")
    requestReview = $true
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://api.sgwa.rajasthan.gov.in/v1/queries/QRY2026001/respond" `
    -Method Post -Headers $headers -Body $body

$response | ConvertTo-Json
```

---

### 3.4 Mark Query as Read

**Endpoint:** `POST /queries/{queryId}/mark-read`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Query marked as read"
}
```

---

## 4. EAC Module APIs

### 4.1 Submit EAC Application

**Endpoint:** `POST /eac/applications`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "nocApplicationId": "NOC2024001",
  "projectName": "Large Scale Industrial Water Project",
  "projectType": "INDUSTRIAL",
  "proposedWaterExtraction": {
    "daily": 5000,
    "annual": 1825000,
    "unit": "m³"
  },
  "projectLocation": {
    "state": "Rajasthan",
    "district": "Jaipur",
    "block": "Sanganer",
    "village": "Kukas",
    "coordinates": {
      "latitude": 26.8467,
      "longitude": 75.7873
    }
  },
  "environmentalImpact": {
    "proposedMitigationMeasures": "Installation of piezometers, rainwater harvesting, wastewater treatment",
    "eiaReportDocId": "DOC2026020",
    "publicHearingDocId": "DOC2026021"
  },
  "expertRecommendations": {
    "geologicalReportDocId": "DOC2026022",
    "hydrogeologicalReportDocId": "DOC2026023"
  },
  "documents": ["DOC2026020", "DOC2026021", "DOC2026022", "DOC2026023"],
  "additionalRemarks": "Project located in semi-critical area, all mitigation measures will be implemented"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "EAC application submitted successfully",
  "data": {
    "eacApplicationId": "EAC2026001",
    "eacNumber": "RJ/EAC/2026/001",
    "submittedDate": "2026-01-08T11:30:00Z",
    "status": "SUBMITTED",
    "estimatedReviewDays": 90
  }
}
```

---

### 4.2 Get EAC Applications

**Endpoint:** `GET /eac/applications`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `status` (optional): SUBMITTED, UNDER_REVIEW, MEETING_SCHEDULED, APPROVED, REJECTED
- `page` (default: 1)
- `limit` (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "eacApplicationId": "EAC2026001",
        "eacNumber": "RJ/EAC/2026/001",
        "projectName": "Large Scale Industrial Water Project",
        "submittedDate": "2026-01-08",
        "status": "UNDER_REVIEW",
        "currentStage": "Technical Review",
        "nextMeetingDate": "2026-02-15"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalRecords": 3,
      "limit": 10
    }
  }
}
```

---

### 4.3 Get EAC Application Details

**Endpoint:** `GET /eac/applications/{eacId}`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "eacApplicationId": "EAC2026001",
    "eacNumber": "RJ/EAC/2026/001",
    "nocApplicationId": "NOC2024001",
    "projectName": "Large Scale Industrial Water Project",
    "submittedDate": "2026-01-08T11:30:00Z",
    "status": "MEETING_SCHEDULED",
    "currentStage": "Expert Committee Review",
    "timeline": [
      {
        "stage": "SUBMITTED",
        "date": "2026-01-08",
        "remarks": "Application received"
      },
      {
        "stage": "UNDER_REVIEW",
        "date": "2026-01-10",
        "remarks": "Technical review initiated"
      },
      {
        "stage": "MEETING_SCHEDULED",
        "date": "2026-01-20",
        "remarks": "Meeting scheduled for 2026-02-15"
      }
    ],
    "committeeDetails": {
      "meetingDate": "2026-02-15T10:00:00Z",
      "meetingVenue": "SGWA Conference Hall, Jaipur",
      "agenda": "Review of large scale water extraction projects",
      "membersPresent": []
    },
    "documents": [],
    "recommendations": null,
    "finalDecision": null
  }
}
```

---

### 4.4 Get EAC Meeting Schedule

**Endpoint:** `GET /eac/meetings`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "meetings": [
      {
        "meetingId": "MTG2026001",
        "meetingDate": "2026-02-15T10:00:00Z",
        "venue": "SGWA Conference Hall, Jaipur",
        "agenda": "Review of large scale water extraction projects",
        "applicationsScheduled": [
          {
            "eacNumber": "RJ/EAC/2026/001",
            "projectName": "Large Scale Industrial Water Project",
            "applicantName": "ABC Industries"
          }
        ],
        "status": "SCHEDULED"
      }
    ]
  }
}
```

---

## 5. Issue Reporting APIs

### 5.1 Create Issue

**Endpoint:** `POST /issues`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "category": "TECHNICAL | PAYMENT | DOCUMENT | LOGIN | GENERAL",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "subject": "Unable to upload documents in application",
  "description": "I am trying to upload project report PDF but getting 'Upload failed' error. File size is 2.5 MB which is within limit.",
  "relatedApplicationId": "NOC2024001",
  "attachments": ["DOC2026030"],
  "browserInfo": {
    "browser": "Chrome 120",
    "os": "Windows 10",
    "screenResolution": "1920x1080"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Issue reported successfully",
  "data": {
    "issueId": "ISS2026001",
    "ticketNumber": "SGWA-2026-001",
    "createdDate": "2026-01-08T12:00:00Z",
    "status": "OPEN",
    "assignedTo": "Support Team",
    "estimatedResponseTime": "24 hours"
  }
}
```

**PowerShell Test:**
```powershell
$body = @{
    category = "TECHNICAL"
    priority = "MEDIUM"
    subject = "Unable to upload documents in application"
    description = "I am trying to upload project report PDF but getting 'Upload failed' error."
    relatedApplicationId = "NOC2024001"
    attachments = @("DOC2026030")
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://api.sgwa.rajasthan.gov.in/v1/issues" `
    -Method Post -Headers $headers -Body $body

$response | ConvertTo-Json
```

---

### 5.2 Get My Issues

**Endpoint:** `GET /issues`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `status` (optional): OPEN, IN_PROGRESS, RESOLVED, CLOSED
- `category` (optional)
- `page` (default: 1)
- `limit` (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 8,
      "open": 2,
      "inProgress": 1,
      "resolved": 5
    },
    "issues": [
      {
        "issueId": "ISS2026001",
        "ticketNumber": "SGWA-2026-001",
        "category": "TECHNICAL",
        "priority": "MEDIUM",
        "subject": "Unable to upload documents in application",
        "status": "IN_PROGRESS",
        "createdDate": "2026-01-08T12:00:00Z",
        "lastUpdated": "2026-01-08T14:30:00Z",
        "assignedTo": "Tech Support - Rajesh",
        "unreadResponses": 1
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalRecords": 8,
      "limit": 10
    }
  }
}
```

---

### 5.3 Get Issue Details

**Endpoint:** `GET /issues/{issueId}`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "issueId": "ISS2026001",
    "ticketNumber": "SGWA-2026-001",
    "category": "TECHNICAL",
    "priority": "MEDIUM",
    "subject": "Unable to upload documents in application",
    "description": "I am trying to upload project report PDF but getting 'Upload failed' error. File size is 2.5 MB which is within limit.",
    "status": "IN_PROGRESS",
    "createdDate": "2026-01-08T12:00:00Z",
    "lastUpdated": "2026-01-08T14:30:00Z",
    "relatedApplicationId": "NOC2024001",
    "assignedTo": {
      "name": "Rajesh Kumar",
      "department": "Technical Support",
      "email": "support@sgwa.raj.gov.in"
    },
    "attachments": [
      {
        "documentId": "DOC2026030",
        "fileName": "error_screenshot.png",
        "fileUrl": "https://cdn.sgwa.gov.in/issues/doc030.png"
      }
    ],
    "conversation": [
      {
        "messageId": "MSG001",
        "sender": "USER",
        "senderName": "You",
        "message": "Unable to upload documents in application...",
        "timestamp": "2026-01-08T12:00:00Z"
      },
      {
        "messageId": "MSG002",
        "sender": "SUPPORT",
        "senderName": "Rajesh Kumar (Support)",
        "message": "Thank you for reporting. We're looking into this issue. Could you please try using Firefox browser and let us know if the issue persists?",
        "timestamp": "2026-01-08T14:30:00Z"
      }
    ],
    "resolution": null,
    "resolvedDate": null
  }
}
```

---

### 5.4 Add Comment to Issue

**Endpoint:** `POST /issues/{issueId}/comments`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "message": "I tried using Firefox and it worked! Thank you for the solution.",
  "attachments": []
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "messageId": "MSG003",
    "timestamp": "2026-01-08T15:00:00Z"
  }
}
```

---

## 6. Payment Details APIs

### 6.1 Get Payment Dashboard

**Endpoint:** `GET /payments/dashboard`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPayments": 15,
      "totalAmountPaid": 125000,
      "pendingPayments": 2,
      "pendingAmount": 25000,
      "lastPaymentDate": "2026-01-05"
    },
    "pendingPayments": [
      {
        "paymentId": "PAY2026001",
        "applicationNumber": "RJ/NOC/2024/001234",
        "paymentType": "APPLICATION_FEE",
        "amount": 15000,
        "gst": 2700,
        "totalAmount": 17700,
        "dueDate": "2026-01-15",
        "status": "PENDING"
      }
    ],
    "recentPayments": [
      {
        "paymentId": "PAY2025050",
        "applicationNumber": "RJ/NOC/2024/001200",
        "paymentType": "APPLICATION_FEE",
        "amount": 10000,
        "paymentDate": "2026-01-05",
        "transactionId": "TXN123456789",
        "status": "SUCCESS"
      }
    ]
  }
}
```

**PowerShell Test:**
```powershell
$response = Invoke-RestMethod -Uri "https://api.sgwa.rajasthan.gov.in/v1/payments/dashboard" `
    -Method Get -Headers $headers

$response | ConvertTo-Json -Depth 10
```

---

### 6.2 Get Payment History

**Endpoint:** `GET /payments/history`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD
- `status` (optional): SUCCESS, PENDING, FAILED
- `page` (default: 1)
- `limit` (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "paymentId": "PAY2025050",
        "receiptNumber": "SGWA/RCT/2026/00050",
        "applicationNumber": "RJ/NOC/2024/001200",
        "paymentType": "APPLICATION_FEE",
        "description": "Fresh NOC Application Fee",
        "amount": 10000,
        "gst": 1800,
        "totalAmount": 11800,
        "paymentMethod": "ONLINE",
        "paymentGateway": "RAZORPAY",
        "transactionId": "TXN123456789",
        "bankReferenceNumber": "BRN987654321",
        "paymentDate": "2026-01-05T10:30:00Z",
        "status": "SUCCESS"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalRecords": 15,
      "limit": 10
    }
  }
}
```

---

### 6.3 Get Payment Receipt

**Endpoint:** `GET /payments/{paymentId}/receipt`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "receiptNumber": "SGWA/RCT/2026/00050",
    "receiptDate": "2026-01-05",
    "paymentDetails": {
      "applicationNumber": "RJ/NOC/2024/001200",
      "paymentType": "APPLICATION_FEE",
      "description": "Fresh NOC Application Fee",
      "amount": 10000,
      "gst": 1800,
      "totalAmount": 11800
    },
    "payerDetails": {
      "name": "Rajesh Kumar",
      "organizationName": "ABC Industries Ltd.",
      "panNumber": "ABCDE1234F",
      "gstNumber": "22ABCDE1234F1Z5"
    },
    "paymentInfo": {
      "paymentMethod": "ONLINE",
      "transactionId": "TXN123456789",
      "bankReferenceNumber": "BRN987654321",
      "paymentDate": "2026-01-05T10:30:00Z"
    },
    "pdfUrl": "https://cdn.sgwa.gov.in/receipts/RCT00050.pdf",
    "digitalSignature": "Digitally signed by SGWA Payment System"
  }
}
```

---

### 6.4 Initiate Online Payment

**Endpoint:** `POST /payments/initiate`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "applicationId": "NOC2024001",
  "paymentType": "APPLICATION_FEE",
  "amount": 15000,
  "gst": 2700,
  "totalAmount": 17700,
  "returnUrl": "https://portal.sgwa.gov.in/payment-callback"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "paymentId": "PAY2026001",
    "orderId": "ORD123456",
    "amount": 17700,
    "currency": "INR",
    "paymentGatewayUrl": "https://razorpay.com/checkout/...",
    "paymentOptions": ["CARD", "NET_BANKING", "UPI", "WALLET"]
  }
}
```

---

### 6.5 Verify Payment Status

**Endpoint:** `GET /payments/{paymentId}/status`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "paymentId": "PAY2026001",
    "status": "SUCCESS",
    "transactionId": "TXN123456790",
    "amount": 17700,
    "paymentDate": "2026-01-08T16:30:00Z",
    "receiptNumber": "SGWA/RCT/2026/00051"
  }
}
```

---

## 7. Charge Revision APIs

### 7.1 Get Charge Revision History

**Endpoint:** `GET /charges/revisions`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `nocNumber` (optional): Filter by NOC
- `page` (default: 1)
- `limit` (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "revisions": [
      {
        "revisionId": "REV2026001",
        "nocNumber": "RJ/NOC/2024/001234",
        "revisionDate": "2026-01-01",
        "effectiveDate": "2026-01-01",
        "reason": "Annual tariff revision as per government circular",
        "oldCharges": {
          "abstractionCharge": 5.00,
          "environmentalCharge": 2.00,
          "totalPerCubicMeter": 7.00
        },
        "newCharges": {
          "abstractionCharge": 6.00,
          "environmentalCharge": 2.50,
          "totalPerCubicMeter": 8.50
        },
        "percentageIncrease": 21.43,
        "circularReference": "SGWA/CIRCULAR/2025/12"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalRecords": 3,
      "limit": 10
    }
  }
}
```

**PowerShell Test:**
```powershell
$response = Invoke-RestMethod -Uri "https://api.sgwa.rajasthan.gov.in/v1/charges/revisions" `
    -Method Get -Headers $headers

$response | ConvertTo-Json -Depth 10
```

---

### 7.2 Calculate Revised Charges

**Endpoint:** `POST /charges/calculate`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "nocNumber": "RJ/NOC/2024/001234",
  "waterExtraction": 125000,
  "unit": "m³/year",
  "blockCategory": "SEMI_CRITICAL",
  "industryType": "MANUFACTURING",
  "effectiveDate": "2026-01-01"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "calculation": {
      "waterExtraction": 125000,
      "unit": "m³/year",
      "currentRates": {
        "abstractionCharge": 6.00,
        "environmentalCharge": 2.50,
        "totalPerCubicMeter": 8.50
      },
      "breakdown": {
        "abstractionCharges": 750000,
        "environmentalCharges": 312500,
        "subtotal": 1062500,
        "gst": 191250,
        "totalAmount": 1253750
      },
      "comparison": {
        "previousTotal": 1003750,
        "currentTotal": 1253750,
        "difference": 250000,
        "percentageIncrease": 24.91
      },
      "effectiveDate": "2026-01-01",
      "calculatedOn": "2026-01-08T17:00:00Z"
    }
  }
}
```

---

### 7.3 Generate Charge Revision Report

**Endpoint:** `GET /charges/revisions/{revisionId}/report`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `format` (optional): PDF, EXCEL (default: PDF)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reportUrl": "https://cdn.sgwa.gov.in/reports/charge_revision_REV2026001.pdf",
    "generatedDate": "2026-01-08T17:15:00Z",
    "format": "PDF"
  }
}
```

---

## 8. Reports Module APIs

### 8.1 Get Available Reports

**Endpoint:** `GET /reports/types`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reportTypes": [
      {
        "reportType": "APPLICATION_SUMMARY",
        "displayName": "Application Summary Report",
        "description": "Summary of all NOC applications with status",
        "category": "APPLICATIONS",
        "formats": ["PDF", "EXCEL"],
        "parameters": [
          {
            "name": "startDate",
            "type": "date",
            "required": false
          },
          {
            "name": "endDate",
            "type": "date",
            "required": false
          },
          {
            "name": "status",
            "type": "select",
            "options": ["ALL", "SUBMITTED", "APPROVED", "REJECTED"],
            "required": false
          }
        ]
      },
      {
        "reportType": "COMPLIANCE_REPORT",
        "displayName": "Compliance Submissions Report",
        "description": "Report of all compliance submissions",
        "category": "COMPLIANCE",
        "formats": ["PDF", "EXCEL"]
      },
      {
        "reportType": "PAYMENT_REPORT",
        "displayName": "Payment Transactions Report",
        "description": "Detailed payment transaction history",
        "category": "PAYMENTS",
        "formats": ["PDF", "EXCEL"]
      }
    ]
  }
}
```

---

### 8.2 Generate Report

**Endpoint:** `POST /reports/generate`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "reportType": "APPLICATION_SUMMARY",
  "format": "PDF",
  "parameters": {
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "status": "ALL"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Report generation initiated",
  "data": {
    "reportId": "RPT2026001",
    "status": "PROCESSING",
    "estimatedTime": "2-3 minutes"
  }
}
```

---

### 8.3 Get Report Status

**Endpoint:** `GET /reports/{reportId}/status`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reportId": "RPT2026001",
    "status": "COMPLETED",
    "reportUrl": "https://cdn.sgwa.gov.in/reports/RPT2026001.pdf",
    "generatedDate": "2026-01-08T17:30:00Z",
    "expiryDate": "2026-01-15T17:30:00Z"
  }
}
```

---

### 8.4 Download Report

**Endpoint:** `GET /reports/{reportId}/download`

**Headers:** `Authorization: Bearer {token}`

**Response:** File download (PDF/Excel)

---

## 9. Utility Tools APIs

### 9.1 Check Block Category

**Endpoint:** `GET /utilities/block-category`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `state`: Rajasthan
- `district`: District name
- `block`: Block name

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "state": "Rajasthan",
    "district": "Jaipur",
    "block": "Sanganer",
    "assessmentUnit": "Jaipur (Sanganer)",
    "category": "SEMI_CRITICAL",
    "categoryDetails": {
      "stageOfDevelopment": 85.5,
      "classification": "SEMI-CRITICAL (70-90%)",
      "waterLevelTrend": "Declining",
      "recommendations": [
        "Mandatory rainwater harvesting",
        "Piezometer installation required",
        "Flow meter installation required",
        "Regular compliance reporting"
      ]
    },
    "nocImplications": {
      "validityPeriod": "3 years",
      "complianceFrequency": "QUARTERLY",
      "additionalRequirements": [
        "Annual groundwater assessment",
        "Rainwater harvesting implementation"
      ]
    },
    "lastAssessmentDate": "2025-06-01",
    "dataSource": "CGWA Assessment 2025"
  }
}
```

**PowerShell Test:**
```powershell
$params = @{
    state = "Rajasthan"
    district = "Jaipur"
    block = "Sanganer"
}

$queryString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
$url = "https://api.sgwa.rajasthan.gov.in/v1/utilities/block-category?$queryString"

$response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers

$response | ConvertTo-Json -Depth 10
```

---

### 9.2 District Finder

**Endpoint:** `GET /utilities/districts`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `search` (optional): Search by district name

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "districts": [
      {
        "districtCode": "RJ01",
        "districtName": "Jaipur",
        "headquarter": "Jaipur",
        "area": 11117.8,
        "population": 6626178,
        "blocks": ["Amber", "Bassi", "Chaksu", "Jamwa Ramgarh", "Kotputli", "Phagi", "Phulera", "Sanganer", "Shahpura", "Viratnagar"],
        "dgoOffice": {
          "address": "District Groundwater Office, Jaipur",
          "phone": "+91-141-2234567",
          "email": "dgo.jaipur@sgwa.raj.gov.in"
        }
      }
    ]
  }
}
```

---

### 9.3 Assessment Unit Lookup

**Endpoint:** `GET /utilities/assessment-units`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `district` (optional): Filter by district
- `search` (optional): Search by name

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "assessmentUnits": [
      {
        "unitId": "AU001",
        "unitName": "Jaipur (Sanganer)",
        "district": "Jaipur",
        "blocks": ["Sanganer", "Bassi"],
        "area": 1234.5,
        "category": "SEMI_CRITICAL",
        "annualRecharge": 125000000,
        "annualExtraction": 106875000,
        "stageOfDevelopment": 85.5,
        "waterLevelTrend": "Declining",
        "boundaryCoordinates": [],
        "hydrogeologicalReport": "https://cdn.sgwa.gov.in/reports/AU001_hydro.pdf"
      }
    ]
  }
}
```

---

### 9.4 Coordinate Converter

**Endpoint:** `POST /utilities/convert-coordinates`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "latitude": 26.8467,
  "longitude": 75.7873,
  "fromFormat": "DECIMAL",
  "toFormat": "DMS"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "input": {
      "latitude": 26.8467,
      "longitude": 75.7873,
      "format": "DECIMAL"
    },
    "output": {
      "latitude": "26° 50' 48.12\" N",
      "longitude": "75° 47' 14.28\" E",
      "format": "DMS"
    }
  }
}
```

---

## 10. Help Center APIs

### 10.1 Get FAQ Categories

**Endpoint:** `GET /help/faq/categories`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "categoryId": "CAT001",
        "categoryName": "Getting Started",
        "icon": "🚀",
        "faqCount": 12
      },
      {
        "categoryId": "CAT002",
        "categoryName": "NOC Applications",
        "icon": "📝",
        "faqCount": 25
      },
      {
        "categoryId": "CAT003",
        "categoryName": "Payments",
        "icon": "💳",
        "faqCount": 8
      }
    ]
  }
}
```

---

### 10.2 Get FAQs

**Endpoint:** `GET /help/faq`

**Query Parameters:**
- `categoryId` (optional): Filter by category
- `search` (optional): Search FAQs

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "faqs": [
      {
        "faqId": "FAQ001",
        "categoryId": "CAT001",
        "question": "How do I register for a new account?",
        "answer": "To register for a new account, click on the 'Register' button on the login page. Fill in your personal details, organization information, and create a strong password. You will receive a verification email to activate your account.",
        "helpful": 145,
        "notHelpful": 5,
        "relatedLinks": [
          {
            "title": "Registration Guide (PDF)",
            "url": "https://sgwa.gov.in/docs/registration_guide.pdf"
          }
        ]
      }
    ]
  }
}
```

---

### 10.3 Search Help Content

**Endpoint:** `GET /help/search`

**Query Parameters:**
- `query`: Search query

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "FAQ",
        "title": "How do I upload documents?",
        "snippet": "Documents can be uploaded in PDF, JPG, or PNG format...",
        "url": "/help/faq/FAQ015"
      },
      {
        "type": "MANUAL",
        "title": "Document Upload Guide",
        "snippet": "Step-by-step guide for uploading documents...",
        "url": "/help/manual/document-upload"
      }
    ]
  }
}
```

---

### 10.4 Get Video Tutorials

**Endpoint:** `GET /help/videos`

**Query Parameters:**
- `category` (optional): Filter by category

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "videoId": "VID001",
        "title": "How to Apply for Fresh NOC",
        "description": "Complete step-by-step guide for applying fresh NOC",
        "duration": "12:35",
        "category": "Applications",
        "thumbnailUrl": "https://cdn.sgwa.gov.in/videos/thumbs/vid001.jpg",
        "videoUrl": "https://cdn.sgwa.gov.in/videos/vid001.mp4",
        "views": 1234,
        "publishedDate": "2025-12-01"
      }
    ]
  }
}
```

---

### 10.5 Submit Support Request

**Endpoint:** `POST /help/support`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "category": "GENERAL_QUERY | TECHNICAL_SUPPORT | ACCOUNT_ISSUE | OTHER",
  "subject": "Need help with document upload",
  "message": "I am unable to upload my land ownership document. The system shows 'Invalid format' error even though I'm uploading a PDF file.",
  "email": "user@example.com",
  "phone": "+91-9876543210"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Support request submitted successfully",
  "data": {
    "ticketNumber": "SUP-2026-001",
    "submittedDate": "2026-01-08T18:00:00Z",
    "estimatedResponseTime": "24-48 hours"
  }
}
```

---

## Common Error Responses

All APIs may return the following error responses:

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication token is missing or invalid"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Requested resource not found"
  }
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

---

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer {jwt_token}
```

The token is obtained from the login endpoint (`POST /auth/login`) and should be included in all subsequent requests.

Token expiry: 1 hour  
Refresh token expiry: 7 days

---

## Rate Limiting

- **Rate Limit:** 1000 requests per hour per user
- **Burst Limit:** 20 requests per second

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1641654000
```

---

## Pagination

List endpoints use cursor-based pagination:

**Request:**
```
GET /applications/noc?page=2&limit=20
```

**Response includes pagination metadata:**
```json
{
  "pagination": {
    "currentPage": 2,
    "totalPages": 10,
    "totalRecords": 195,
    "limit": 20
  }
}
```

---

## File Uploads

File uploads use multipart/form-data:

- **Maximum file size:** 10 MB
- **Supported formats:** PDF, JPG, PNG, JPEG
- **Multiple files:** Use array notation `documents[]`

---

## Webhooks (Optional)

For real-time notifications, webhooks can be configured for:
- Application status changes
- Query notifications
- Payment confirmations
- Compliance deadlines

Configure webhooks in Account Settings > Webhooks

---

**End of Enhanced Features API Documentation**
