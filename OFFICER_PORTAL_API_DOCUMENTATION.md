# Officer Portal APIs - Complete Reference
**For SGWA, DGO, and Enforcement Wing Officers**

---

## 📋 Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [SGWA Officer APIs](#sgwa-officer-apis)
3. [DGO Officer APIs](#dgo-officer-apis)
4. [Enforcement Wing APIs](#enforcement-wing-apis)
5. [Common Officer APIs](#common-officer-apis)
6. [Response Formats](#response-formats)
7. [Testing Examples](#testing-examples)

---

## Authentication APIs

### 1. Officer Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "officer@sgwa.gov.in",
  "password": "SecurePassword@123",
  "userType": "RSGWA" | "DGO" | "ENFORCEMENT",
  "captcha": "5A7K9"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "user": {
      "id": "uuid",
      "username": "officer@sgwa.gov.in",
      "name": "Officer Name",
      "userType": "RSGWA",
      "designation": "Chief Engineer",
      "department": "SGWA",
      "permissions": ["VIEW_APPLICATIONS", "APPROVE_NOC", "ASSIGN_TASKS"]
    }
  }
}
```

### 2. Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

### 3. Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

---

## SGWA Officer APIs

### Dashboard & Statistics

#### 1. SGWA Dashboard Stats
```http
GET /api/officer/sgwa/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalApplications": 250,
      "pendingReview": 45,
      "underInspection": 12,
      "approvedThisMonth": 28,
      "rejectedThisMonth": 5,
      "pendingPayments": 8,
      "activeNOCs": 180,
      "expiringNOCs": 15
    },
    "recentApplications": [
      {
        "applicationId": "uuid",
        "applicationNumber": "NOC/RAJ/2026/00123",
        "applicantName": "Industrial Corp",
        "projectName": "Manufacturing Unit",
        "district": "Jaipur",
        "status": "PENDING_SGWA_APPROVAL",
        "submittedDate": "2026-01-10T10:30:00Z",
        "dgoRecommendation": "APPROVED",
        "assignedOfficer": "Officer Name"
      }
    ],
    "alerts": [
      {
        "type": "URGENT",
        "message": "12 applications pending approval for > 15 days",
        "count": 12
      }
    ]
  }
}
```

#### 2. Application List with Filters
```http
GET /api/officer/sgwa/applications?status=PENDING_SGWA_APPROVAL&district=Jaipur&page=1&limit=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` - Filter by status (PENDING_SGWA_APPROVAL, APPROVED, REJECTED, etc.)
- `district` - Filter by district
- `dateFrom` - Start date (ISO format)
- `dateTo` - End date (ISO format)
- `search` - Search by application number or applicant name
- `page` - Page number
- `limit` - Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "itemsPerPage": 20
    }
  }
}
```

#### 3. View Application Details
```http
GET /api/officer/sgwa/applications/{applicationId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "uuid",
      "applicationNumber": "NOC/RAJ/2026/00123",
      "applicantDetails": {...},
      "projectDetails": {...},
      "locationDetails": {...},
      "waterRequirement": {...},
      "documents": [...],
      "workflow": {
        "currentStage": "SGWA_REVIEW",
        "dgoRecommendation": "APPROVED",
        "dgoRemarks": "Application meets all criteria",
        "inspectionReport": {...},
        "history": [...]
      }
    }
  }
}
```

#### 4. Approve Application
```http
POST /api/officer/sgwa/applications/{applicationId}/approve
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "nocValidityYears": 3,
  "conditions": [
    "Installation of water meter mandatory",
    "Quarterly compliance reports required",
    "Annual audit by empaneled agency"
  ],
  "waterAllocationLimit": 100,
  "remarks": "Approved with standard conditions",
  "attachments": ["document-uuid-1", "document-uuid-2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "uuid",
    "status": "NOC_ISSUED",
    "nocNumber": "RJ/CGWA/NOC/2026/00123",
    "issueDate": "2026-01-12",
    "validUpto": "2029-01-11",
    "certificateUrl": "/api/certificates/uuid/download"
  }
}
```

#### 5. Reject Application
```http
POST /api/officer/sgwa/applications/{applicationId}/reject
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "rejectionReasons": [
    "Incomplete documentation",
    "Located in over-exploited block",
    "Environmental clearance pending"
  ],
  "remarks": "Detailed remarks for rejection",
  "allowResubmission": true
}
```

#### 6. Request Additional Information
```http
POST /api/officer/sgwa/applications/{applicationId}/query
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "queryText": "Please provide updated environmental clearance",
  "requiredDocuments": ["Environmental Clearance", "NOC from Pollution Board"],
  "dueDate": "2026-01-20",
  "priority": "HIGH"
}
```

#### 7. Assign Application to Officer
```http
POST /api/officer/sgwa/applications/{applicationId}/assign
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "officerId": "officer-uuid",
  "remarks": "Assign for detailed review"
}
```

#### 8. Generate Reports
```http
POST /api/officer/sgwa/reports/generate
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "reportType": "MONTHLY_SUMMARY" | "DISTRICT_WISE" | "COMPLIANCE_REPORT",
  "dateFrom": "2026-01-01",
  "dateTo": "2026-01-31",
  "districts": ["Jaipur", "Udaipur"],
  "format": "PDF" | "EXCEL"
}
```

---

## DGO Officer APIs

### Dashboard & Operations

#### 1. DGO Dashboard Stats
```http
GET /api/officer/dgo/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "assignedApplications": 35,
      "pendingInspection": 12,
      "completedInspections": 18,
      "recommendedForApproval": 20,
      "recommendedForRejection": 3,
      "queriesRaised": 5
    },
    "myDistrict": "Jaipur",
    "recentApplications": [...],
    "upcomingInspections": [...]
  }
}
```

#### 2. Get Assigned Applications
```http
GET /api/officer/dgo/applications?status=PENDING_DGO_REVIEW
Authorization: Bearer {token}
```

#### 3. View Application
```http
GET /api/officer/dgo/applications/{applicationId}
Authorization: Bearer {token}
```

#### 4. Schedule Site Inspection
```http
POST /api/officer/dgo/applications/{applicationId}/schedule-inspection
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "inspectionDate": "2026-01-15T10:00:00Z",
  "inspectorName": "Field Officer Name",
  "purpose": "Site Visit for NOC verification",
  "notifyApplicant": true
}
```

#### 5. Submit Inspection Report
```http
POST /api/officer/dgo/applications/{applicationId}/inspection-report
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "inspectionDate": "2026-01-15",
  "findings": {
    "locationVerified": true,
    "waterSourceVerified": true,
    "documentationAccurate": true,
    "environmentalCompliance": true,
    "neighborhoodConsent": true
  },
  "observations": "Site inspection completed. All details verified.",
  "photographs": ["photo-uuid-1", "photo-uuid-2"],
  "recommendation": "APPROVE" | "REJECT" | "QUERY",
  "recommendationRemarks": "Recommend approval with standard conditions",
  "proposedConditions": [...]
}
```

#### 6. Forward to SGWA
```http
POST /api/officer/dgo/applications/{applicationId}/forward
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "recommendation": "APPROVED" | "REJECTED" | "CONDITIONAL_APPROVAL",
  "remarks": "DGO recommendation remarks",
  "supportingDocuments": ["doc-uuid-1"]
}
```

#### 7. Raise Query to Applicant
```http
POST /api/officer/dgo/applications/{applicationId}/query
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "queryText": "Please clarify water extraction methodology",
  "requiredDocuments": ["Technical Drawing", "Bore Well Details"],
  "dueDate": "2026-01-20"
}
```

#### 8. District-wise Compliance Report
```http
GET /api/officer/dgo/compliance-report?month=2026-01
Authorization: Bearer {token}
```

---

## Enforcement Wing APIs

### Inspection & Monitoring

#### 1. Enforcement Dashboard
```http
GET /api/officer/enforcement/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalInspections": 45,
      "violationsDetected": 12,
      "warningsIssued": 8,
      "noCsCancelled": 2,
      "penaltiesImposed": 5,
      "activeComplaints": 15
    },
    "recentInspections": [...],
    "pendingActions": [...]
  }
}
```

#### 2. Get All Active NOCs for Monitoring
```http
GET /api/officer/enforcement/active-nocs?district=Jaipur
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nocs": [
      {
        "nocId": "uuid",
        "nocNumber": "RJ/CGWA/NOC/2026/00123",
        "applicantName": "Company Name",
        "projectName": "Manufacturing Unit",
        "district": "Jaipur",
        "issueDate": "2026-01-01",
        "validUpto": "2029-01-01",
        "lastInspectionDate": "2025-11-15",
        "complianceStatus": "COMPLIANT" | "NON_COMPLIANT" | "WARNING",
        "waterAllocationLimit": 100
      }
    ]
  }
}
```

#### 3. Schedule Compliance Inspection
```http
POST /api/officer/enforcement/inspections/schedule
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "nocId": "uuid",
  "inspectionType": "ROUTINE" | "COMPLAINT_BASED" | "RANDOM",
  "scheduledDate": "2026-01-20T10:00:00Z",
  "inspectorDetails": {
    "name": "Inspector Name",
    "designation": "Field Officer",
    "contactNumber": "9876543210"
  },
  "purpose": "Quarterly compliance check",
  "notifyHolder": true
}
```

#### 4. Submit Inspection Report
```http
POST /api/officer/enforcement/inspections/{inspectionId}/report
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "inspectionDate": "2026-01-20",
  "nocHolderId": "uuid",
  "nocNumber": "RJ/CGWA/NOC/2026/00123",
  "findings": {
    "waterMeterInstalled": true,
    "waterMeterFunctioning": true,
    "actualExtraction": 95,
    "permittedExtraction": 100,
    "complianceReportSubmitted": true,
    "conditionsFollowed": true,
    "environmentalNorms": true
  },
  "violations": [
    {
      "type": "METER_TAMPERING",
      "severity": "HIGH",
      "description": "Water meter seal broken",
      "evidence": ["photo-uuid-1", "photo-uuid-2"]
    }
  ],
  "photographs": [...],
  "recommendations": "Issue warning notice",
  "actionRequired": "WARNING" | "PENALTY" | "CANCELLATION" | "NONE"
}
```

#### 5. Issue Warning Notice
```http
POST /api/officer/enforcement/violations/warning
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "nocId": "uuid",
  "violationType": "METER_TAMPERING",
  "warningText": "Warning notice content",
  "correctiveActions": [
    "Install new water meter",
    "Submit calibration certificate"
  ],
  "complianceDeadline": "2026-02-01",
  "consequencesOfNonCompliance": "NOC may be cancelled"
}
```

#### 6. Impose Penalty
```http
POST /api/officer/enforcement/violations/penalty
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "nocId": "uuid",
  "violationType": "EXCESS_EXTRACTION",
  "penaltyAmount": 50000,
  "penaltyReason": "Exceeded permitted water extraction limit",
  "evidenceDocuments": ["inspection-report-uuid"],
  "paymentDeadline": "2026-02-15"
}
```

#### 7. Initiate NOC Cancellation
```http
POST /api/officer/enforcement/noc/{nocId}/initiate-cancellation
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "cancellationReason": "Repeated violations and non-compliance",
  "violations": ["violation-id-1", "violation-id-2"],
  "showCauseNoticeDate": "2026-01-25",
  "hearingDate": "2026-02-05",
  "recommendingAuthority": "Enforcement Officer Name"
}
```

#### 8. Register Public Complaint
```http
POST /api/officer/enforcement/complaints/register
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "complaintType": "UNAUTHORIZED_EXTRACTION",
  "location": {
    "district": "Jaipur",
    "address": "Detailed address"
  },
  "description": "Complaint details",
  "complainantDetails": {
    "name": "Complainant Name",
    "contact": "9876543210"
  },
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "assignedOfficer": "officer-uuid"
}
```

#### 9. View Complaint Details
```http
GET /api/officer/enforcement/complaints/{complaintId}
Authorization: Bearer {token}
```

#### 10. Update Complaint Status
```http
PUT /api/officer/enforcement/complaints/{complaintId}/status
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "INVESTIGATING" | "RESOLVED" | "DISMISSED",
  "actionTaken": "Description of action",
  "remarks": "Officer remarks",
  "attachments": ["doc-uuid"]
}
```

---

## Common Officer APIs

### Applicable to all officer types

#### 1. Get Profile
```http
GET /api/officer/profile
Authorization: Bearer {token}
```

#### 2. Update Profile
```http
PUT /api/officer/profile
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Officer Name",
  "contactNumber": "9876543210",
  "email": "officer@sgwa.gov.in"
}
```

#### 3. Change Password
```http
POST /api/officer/change-password
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123"
}
```

#### 4. Get Notifications
```http
GET /api/officer/notifications?unreadOnly=true
Authorization: Bearer {token}
```

#### 5. Mark Notification as Read
```http
PUT /api/officer/notifications/{notificationId}/read
Authorization: Bearer {token}
```

#### 6. Get Activity Log
```http
GET /api/officer/activity-log?page=1&limit=20
Authorization: Bearer {token}
```

#### 7. Upload Document
```http
POST /api/officer/documents/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `file` - File to upload
- `documentType` - Type of document
- `relatedTo` - Application ID or NOC ID

#### 8. Download Document
```http
GET /api/officer/documents/{documentId}/download
Authorization: Bearer {token}
```

#### 9. Search Applications Globally
```http
GET /api/officer/search?q=NOC/RAJ/2026&type=application
Authorization: Bearer {token}
```

#### 10. Get Master Data
```http
GET /api/officer/master-data/districts
GET /api/officer/master-data/blocks?districtId={id}
GET /api/officer/master-data/violation-types
GET /api/officer/master-data/penalty-amounts
Authorization: Bearer {token}
```

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or expired token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input
- `APPLICATION_NOT_FOUND` - Application ID invalid
- `ALREADY_PROCESSED` - Action already completed
- `INVALID_STATUS_TRANSITION` - Invalid workflow state change

---

## Testing Examples

### PowerShell - SGWA Officer Login & Get Dashboard
```powershell
# 1. Login
$loginBody = @{
    username = "sgwa.officer@rajasthan.gov.in"
    password = "SecurePass@123"
    userType = "RSGWA"
    captcha = "5A7K9"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $loginBody

$token = $loginResponse.data.token

# 2. Get Dashboard
Invoke-RestMethod -Uri "http://localhost:3000/api/officer/sgwa/dashboard" `
    -Method GET `
    -Headers @{"Authorization"="Bearer $token"}
```

### cURL - DGO Officer Submit Inspection
```bash
# Login first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dgo.jaipur@rajasthan.gov.in",
    "password": "SecurePass@123",
    "userType": "DGO",
    "captcha": "5A7K9"
  }'

# Submit inspection report
curl -X POST http://localhost:3000/api/officer/dgo/applications/{applicationId}/inspection-report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectionDate": "2026-01-15",
    "findings": {
      "locationVerified": true,
      "waterSourceVerified": true,
      "documentationAccurate": true
    },
    "recommendation": "APPROVE",
    "recommendationRemarks": "All criteria met"
  }'
```

### PowerShell - Enforcement Issue Warning
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN"
    "Content-Type" = "application/json"
}

$warningBody = @{
    nocId = "noc-uuid-here"
    violationType = "METER_TAMPERING"
    warningText = "Water meter seal found broken during inspection"
    correctiveActions = @("Install new certified meter", "Submit calibration report")
    complianceDeadline = "2026-02-01"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/officer/enforcement/violations/warning" `
    -Method POST `
    -Headers $headers `
    -Body $warningBody
```

---

## API Summary Table

| Officer Type | Total APIs | Key Features |
|-------------|-----------|--------------|
| **SGWA** | 15+ | Dashboard, Applications, Approve/Reject, Reports |
| **DGO** | 12+ | Inspections, Site Visits, Forward to SGWA |
| **Enforcement** | 18+ | Monitoring, Violations, Penalties, Complaints |
| **Common** | 10+ | Profile, Notifications, Documents, Search |

---

## Implementation Priority

### Phase 1 (High Priority)
1. ✅ Authentication APIs
2. ✅ SGWA Dashboard & Application Review
3. ✅ DGO Inspection & Recommendation
4. ✅ Common Profile & Notification APIs

### Phase 2 (Medium Priority)
1. ⏳ Enforcement Monitoring & Violations
2. ⏳ Report Generation
3. ⏳ Advanced Search & Filters

### Phase 3 (Future Enhancements)
1. ⏳ Analytics & Insights
2. ⏳ Bulk Operations
3. ⏳ Integration with External Systems

---

## Notes for Backend Development

1. **Authentication**: All APIs require Bearer token authentication
2. **Role-Based Access**: Implement proper RBAC for each officer type
3. **Audit Trail**: Log all officer actions for compliance
4. **File Uploads**: Support multipart/form-data for documents
5. **Pagination**: Implement cursor-based or offset pagination
6. **Rate Limiting**: Implement rate limits per officer/IP
7. **Webhooks**: Consider webhooks for real-time notifications
8. **API Versioning**: Version APIs for backward compatibility

---

**Last Updated:** 2026-01-12  
**Version:** 1.0  
**Contact:** Technical Team - SGWA Portal Development
