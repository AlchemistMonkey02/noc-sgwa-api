# DGO Officer - Complete API Documentation

## Overview
**DGO (District Ground Water Officer)** is responsible for initial application review, document verification, and scheduling inspections before forwarding to SGWA.

- **Base URL**: `/api/officer/dgo`
- **Authentication**: Bearer Token with `DGO` role
- **District Scope**: DGO can only access applications from their assigned district

---

## Authentication

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dgo.jaipur@rajasthan.gov.in",
    "password": "dgo123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "firstName": "DGO",
      "email": "dgo.jaipur@rajasthan.gov.in",
      "role": "DGO",
      "district": "Jaipur"
    }
  }
}
```

**Save token for subsequent requests:**
```bash
export DGO_TOKEN="your_token_here"
```

---

## 1. Dashboard & Statistics

### 1.1 Get Dashboard
```bash
curl -X GET http://localhost:5000/api/officer/dgo/dashboard \
  -H "Authorization: Bearer $DGO_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalApplications": 45,
      "pendingReview": 8,
      "approved": 30,
      "rejected": 5,
      "queriesRaised": 12,
      "inspectionsPending": 3
    },
    "recentActivity": [
      {
        "applicationNumber": "RJ/NOC/2026/001234",
        "action": "APPROVED",
        "timestamp": "2026-01-18T10:00:00Z"
      }
    ]
  }
}
```

### 1.2 Get Statistics (Alternative)
```bash
curl -X GET http://localhost:5000/api/officer/dgo/stats \
  -H "Authorization: Bearer $DGO_TOKEN"
```

---

## 2. Application Management

### 2.1 Get Applications List
```bash
# Get all applications
curl -X GET http://localhost:5000/api/officer/dgo/applications \
  -H "Authorization: Bearer $DGO_TOKEN"

# With filters
curl -X GET "http://localhost:5000/api/officer/dgo/applications?status=PENDING_DGO_REVIEW&page=1&limit=20" \
  -H "Authorization: Bearer $DGO_TOKEN"
```

**Query Parameters:**
- `status` - Filter by status (SUBMITTED, PENDING_DGO_REVIEW, DOCUMENTS_VERIFIED, etc.)
- `search` - Search by application number or applicant name
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `fromDate` - Filter from date (YYYY-MM-DD)
- `toDate` - Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "applicationId": "app_uuid_123",
        "applicationNumber": "RJ/CGWA/NOC/2026/001234",
        "trackingId": "TRACK123456",
        "applicantName": "ABC Industries Ltd",
        "projectName": "Textile Manufacturing Unit",
        "district": "Jaipur",
        "waterRequirement": 150.5,
        "status": "PENDING_DGO_REVIEW",
        "submittedDate": "2026-01-15T08:00:00Z",
        "daysInQueue": 3
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### 2.2 Get Application Details
```bash
# By application ID
curl -X GET http://localhost:5000/api/officer/dgo/applications/app_uuid_123 \
  -H "Authorization: Bearer $DGO_TOKEN"

# By tracking ID
curl -X GET http://localhost:5000/api/officer/dgo/applications/TRACK123456 \
  -H "Authorization: Bearer $DGO_TOKEN"
```

**Response:** Full application object including:
- Project details
- Applicant information
- Location details
- Water requirements
- Groundwater structures
- Documents uploaded
- Approval workflow status

---

## 3. Document Verification

### 3.1 Verify Documents
```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/app_uuid_123/verify-documents \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentsVerified": true,
    "remarks": "All mandatory documents verified and found compliant",
    "verifiedDocuments": [
      "LAND_OWNERSHIP_PROOF",
      "PROJECT_PROPOSAL",
      "ENVIRONMENTAL_CLEARANCE",
      "WATER_REQUIREMENT_CALCULATION"
    ],
    "missingDocuments": []
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "app_uuid_123",
    "status": "DOCUMENTS_VERIFIED",
    "approvalFlow": {
      "dgo": {
        "documentVerification": {
          "verified": true,
          "verifiedAt": "2026-01-18T09:00:00Z",
          "verifiedBy": "dgo_officer_id",
          "remarks": "All mandatory documents verified and found compliant"
        }
      }
    }
  },
  "message": "Documents verified successfully"
}
```

**If documents missing:**
```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/app_uuid_123/verify-documents \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentsVerified": false,
    "remarks": "Some mandatory documents are missing",
    "verifiedDocuments": ["LAND_OWNERSHIP_PROOF"],
    "missingDocuments": ["ENVIRONMENTAL_CLEARANCE", "WATER_AUDIT_REPORT"]
  }'
```

---

## 4. Inspection Management

### 4.1 Schedule Inspection
**Assigns inspection to Inspection Officer by ID**

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/app_uuid_123/schedule-inspection \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectorId": "INSPECTOR_001",
    "inspectionDate": "2026-01-25",
    "purpose": "Site verification and borewell inspection",
    "checkpoints": [
      "Verify proposed borewell location coordinates",
      "Check land ownership documents on-site",
      "Verify existing water sources",
      "Inspect nearby wetlands if applicable"
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "applicationId": "app_uuid_123",
      "status": "INSPECTION_SCHEDULED",
      "approvalFlow": {
        "dgo": {
          "inspectionScheduledAt": "2026-01-18T10:00:00Z",
          "inspectionAssignedTo": "INSPECTOR_001",
          "inspectionId": "INSP_12345"
        }
      }
    },
    "inspection": {
      "inspectionId": "INSP_12345",
      "applicationId": "app_uuid_123",
      "officerId": "INSPECTOR_001",
      "scheduledDate": "2026-01-25",
      "status": "SCHEDULED"
    }
  },
  "message": "Inspection scheduled successfully"
}
```

### 4.2 Get Inspection Report
**View report submitted by Inspection Officer**

```bash
curl -X GET http://localhost:5000/api/officer/dgo/inspections/app_uuid_123/report \
  -H "Authorization: Bearer $DGO_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inspectionId": "INSP_12345",
    "applicationId": "app_uuid_123",
    "inspectedBy": "INSPECTOR_001",
    "inspectionDate": "2026-01-25",
    "status": "COMPLETED",
    "siteVerified": true,
    "findings": "Site location matches application details. Proposed borewell location is suitable.",
    "recommendations": "Approve with standard conditions",
    "locationMatch": true,
    "landUseMatch": true,
    "existingSources": 2,
    "meterInstalled": "NO",
    "rainwaterHarvesting": "NOT_STARTED",
    "photos": [
      "inspection_photo_1.jpg",
      "inspection_photo_2.jpg"
    ],
    "geoLocation": {
      "latitude": 26.9124,
      "longitude": 75.7873,
      "accuracy": 10
    },
    "remarks": "All details verified on ground"
  }
}
```

---

## 5. Query Management

### 5.1 Raise Query to Applicant
```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/app_uuid_123/query \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Clarification on Water Requirement Calculation",
    "question": "Please provide detailed breakdown of industrial water consumption per production process",
    "category": "TECHNICAL",
    "documents": ["WATER_AUDIT_REPORT", "PROCESS_FLOW_DIAGRAM"],
    "deadline": "2026-02-05"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "queryId": "QUERY_001",
    "applicationId": "app_uuid_123",
    "status": "PENDING",
    "raisedBy": "dgo_officer_id",
    "raisedAt": "2026-01-18T10:00:00Z",
    "deadline": "2026-02-05T23:59:59Z"
  },
  "message": "Query raised successfully"
}
```

### 5.2 Get All Queries
```bash
# Get queries raised by this DGO
curl -X GET http://localhost:5000/api/officer/dgo/queries \
  -H "Authorization: Bearer $DGO_TOKEN"

# With filters
curl -X GET "http://localhost:5000/api/officer/dgo/queries?status=PENDING&page=1" \
  -H "Authorization: Bearer $DGO_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "queryId": "QUERY_001",
      "applicationNumber": "RJ/CGWA/NOC/2026/001234",
      "subject": "Clarification on Water Requirement",
      "status": "PENDING",
      "raisedAt": "2026-01-18T10:00:00Z",
      "deadline": "2026-02-05T23:59:59Z"
    }
  ]
}
```

### 5.3 Get Query Details
```bash
curl -X GET http://localhost:5000/api/officer/dgo/queries/QUERY_001 \
  -H "Authorization: Bearer $DGO_TOKEN"
```

### 5.4 Accept Query Response
```bash
curl -X POST http://localhost:5000/api/officer/dgo/queries/QUERY_001/accept \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "Response satisfactory. All requested documents provided and verified."
  }'
```

### 5.5 Reject Query Response
```bash
curl -X POST http://localhost:5000/api/officer/dgo/queries/QUERY_001/reject \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Incomplete information",
    "remarks": "Water audit report does not include monthly consumption breakdown as requested"
  }'
```

---

## 6. Approval Actions

### 6.1 Approve Application
**Forwards application to SGWA for next level review**

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/app_uuid_123/approve \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation": "RECOMMENDED",
    "technicalReview": "Application meets all technical requirements. Proposed water extraction is within sustainable limits based on aquifer capacity.",
    "conditions": [
      "Install digital flow meter with telemetry within 30 days of NOC issuance",
      "Implement rainwater harvesting system as per approved design",
      "Submit quarterly water extraction reports"
    ],
    "remarks": "Documents verified. Inspection report positive. Recommend approval subject to standard CGWA conditions."
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "app_uuid_123",
    "status": "DGO_APPROVED",
    "approvalFlow": {
      "dgo": {
        "status": "APPROVED",
        "approvedBy": "dgo_officer_id",
        "approvedAt": "2026-01-18T11:00:00Z",
        "recommendation": "RECOMMENDED",
        "technicalReview": "Application meets all technical requirements...",
        "remarks": "Documents verified. Inspection report positive..."
      }
    }
  },
  "message": "Application approved and forwarded to SGWA"
}
```

### 6.2 Forward to SGWA (Alternative Endpoint)
```bash
# Same as approve
curl -X POST http://localhost:5000/api/officer/dgo/applications/app_uuid_123/forward \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ... same payload as approve ... }'
```

### 6.3 Reject Application
```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/app_uuid_123/reject \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "TECHNICAL_NON_COMPLIANCE",
    "remarks": "Proposed water extraction exceeds sustainable yield of the aquifer. Area is categorized as Over-Exploited as per latest CGWA assessment.",
    "details": "As per CGWA guidelines 2023, no new NOCs can be issued in over-exploited blocks. Applicant may apply for NOC in future if block status improves."
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "app_uuid_123",
    "status": "REJECTED_BY_DGO",
    "approvalFlow": {
      "dgo": {
        "status": "REJECTED",
        "rejectedBy": "dgo_officer_id",
        "rejectedAt": "2026-01-18T11:00:00Z",
        "reason": "TECHNICAL_NON_COMPLIANCE",
        "remarks": "Proposed water extraction exceeds sustainable yield..."
      }
    }
  },
  "message": "Application rejected"
}
```

---

## 7. Reports

### 7.1 Get Compliance Report
```bash
curl -X GET "http://localhost:5000/api/officer/dgo/compliance-report?fromDate=2026-01-01&toDate=2026-01-31" \
  -H "Authorization: Bearer $DGO_TOKEN"
```

### 7.2 Generate Custom Report
```bash
curl -X POST http://localhost:5000/api/officer/dgo/reports/generate \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "MONTHLY_SUMMARY",
    "month": "2026-01",
    "format": "PDF"
  }'
```

---

## Complete Endpoint Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Authentication** |
| POST | `/api/auth/login` | Login and get JWT token |
| **Dashboard** |
| GET | `/api/officer/dgo/dashboard` | Get dashboard statistics |
| GET | `/api/officer/dgo/stats` | Alternative stats endpoint |
| **Applications** |
| GET | `/api/officer/dgo/applications` | List applications |
| GET | `/api/officer/dgo/applications/:id` | Get application details |
| **Document Verification** |
| POST | `/api/officer/dgo/applications/:id/verify-documents` | Verify documents |
| **Inspections** |
| POST | `/api/officer/dgo/applications/:id/schedule-inspection` | Schedule inspection (assign to Inspector) |
| GET | `/api/officer/dgo/inspections/:id/report` | View inspection report |
| **Approval** |
| POST | `/api/officer/dgo/applications/:id/approve` | Approve & forward to SGWA |
| POST | `/api/officer/dgo/applications/:id/forward` | Same as approve |
| POST | `/api/officer/dgo/applications/:id/reject` | Reject application |
| **Queries** |
| POST | `/api/officer/dgo/applications/:id/query` | Raise query |
| GET | `/api/officer/dgo/queries` | List queries |
| GET | `/api/officer/dgo/queries/:id` | Get query details |
| POST | `/api/officer/dgo/queries/:id/accept` | Accept query response |
| POST | `/api/officer/dgo/queries/:id/reject` | Reject query response |
| **Reports** |
| GET | `/api/officer/dgo/compliance-report` | Get compliance report |
| POST | `/api/officer/dgo/reports/generate` | Generate custom report |

---

## Common Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## Error Handling

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Please login to access this resource"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_ACCESS",
    "message": "You do not have permission to access applications outside your district"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "APPLICATION_NOT_FOUND",
    "message": "Application not found or doesn't belong to your district"
  }
}
```

---

## Notes

1. **District Restriction**: DGO can only access applications from their assigned district
2. **Inspection Assignment**: DGO schedules inspection by providing Inspection Officer ID
3. **Inspection Report**: DGO can view report only after Inspection Officer submits it
4. **Query Categories**: `TECHNICAL`, `DOCUMENTARY`, `LEGAL`, `FINANCIAL`
5. **Recommendation Types**: `RECOMMENDED`, `NOT_RECOMMENDED`, `RECOMMENDED_WITH_CONDITIONS`
6. **Document Types**: 
   - LAND_OWNERSHIP_PROOF
   - PROJECT_PROPOSAL
   - ENVIRONMENTAL_CLEARANCE
   - WATER_REQUIREMENT_CALCULATION
   - SITE_PLAN
   - WATER_AUDIT_REPORT
