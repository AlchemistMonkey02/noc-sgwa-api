# Enforcement Wing API - Complete Guide

## Base URL
`/api/officer/enforcement`

**Authentication Required**: Bearer Token with `ENFORCEMENT` role

---

## 1. Dashboard

### Get Enforcement Dashboard
```bash
curl -X GET http://localhost:5000/api/officer/enforcement/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalDecisions": 120,
      "pendingFinalApproval": 8,
      "approved": 102,
      "rejected": 10,
      "nocIssued": 100
    },
    "alerts": []
  }
}
```

---

## 2. Approval Queue

### Get Approval Queue
```bash
curl -X GET "http://localhost:5000/api/officer/enforcement/approval-queue?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "applicationId": "app_123",
        "applicationNumber": "RJ/CGWA/NOC/2026/001234",
        "applicantName": "Rajesh Kumar Sharma",
        "projectName": "ABC Textile Unit",
        "district": "Jaipur",
        "waterRequirement": 150.25,
        "dgoRecommendation": "RECOMMENDED",
        "sgwaRecommendation": "RECOMMENDED_WITH_CONDITIONS",
        "status": "AWAITING_FINAL_APPROVAL",
        "daysInQueue": 2
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 10 }
  }
}
```

---

## 3. Application Actions

### Get Application Details
```bash
curl -X GET http://localhost:5000/api/officer/enforcement/applications/APP123456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue Final NOC (Approve)
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/applications/APP123456/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "Final verification done. NOC fees verified.",
    "validityYears": 5,
    "conditions": [
      "Install digital flow meter within 30 days",
      "Submit quarterly compliance reports"
    ],
    "generateCertificate": true
  }'
```

### Reject Application
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/applications/APP123456/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Fees not paid",
    "remarks": "Applicant failed to deposit NOC issuance charges."
  }'
```

---

## 4. Compliance Monitoring

### Get Compliance List
```bash
# Get NOCs with compliance status
curl -X GET "http://localhost:5000/api/officer/enforcement/compliance?status=NON_COMPLIANT&district=DIST001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "nocNumber": "RJ/CGWA/NOC/2025/001101",
        "companyName": "Maruti Textiles",
        "district": "Bhilwara",
        "telemetryInstalled": true,
        "lastTelemetryData": "2026-01-17T10:00:00Z",
        "complianceStatus": "COMPLIANT",
        "validFrom": "2025-01-01",
        "validUntil": "2030-01-01"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 50 }
  }
}
```

### Issue Violation Notice
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/compliance/NOC123456/issue-notice \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "violationType": "OVER_EXTRACTION",
    "description": "Exceeded daily limit by 20% for 3 consecutive days.",
    "deadlineDate": "2026-02-01"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Violation notice issued successfully",
  "data": {
    "violationId": "uuid-here",
    "nocNumber": "NOC123456",
    "violationType": "OVER_EXTRACTION",
    "status": "PENDING",
    "deadlineDate": "2026-02-01"
  }
}
```

---

## 5. Other Actions

### Return Application to SGWA
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/applications/APP123456/return \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Technical review needed",
    "remarks": "Groundwater extraction calculation requires SGWA verification"
  }'
```

### Raise Query
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/applications/APP123456/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Please provide proof of rainwater harvesting installation",
    "category": "TECHNICAL",
    "deadline": "2026-02-15"
  }'
```

### Revoke NOC
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/nocs/NOC123456/revoke \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "NON_COMPLIANCE",
    "remarks": "Repeated violations of extraction limits",
    "effectiveDate": "2026-02-01"
  }'
```

### Schedule Inspection
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/inspections/schedule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "APP123456",
    "scheduledDate": "2026-02-10",
    "purpose": "Quarterly compliance verification",
    "checkpoints": ["Verify flow meter", "Check records"]
  }'
```

### Register Complaint
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/complaints/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nocId": "NOC123456",
    "complaintType": "UNAUTHORIZED_EXTRACTION",
    "description": "Borewell operating without NOC approval",
    "urgency": "HIGH"
  }'
```

---

## Complete Endpoint List

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard statistics |
| GET | `/approval-queue` | Applications pending approval |
| GET | `/applications/:id` | Get application details |
| POST | `/applications/:id/approve` | Issue NOC |
| POST | `/applications/:id/reject` | Reject application |
| POST | `/applications/:id/return` | Return to SGWA |
| POST | `/applications/:id/query` | Raise query |
| **GET** | **/compliance** | **List NOCs with compliance status** ⭐ NEW |
| **POST** | **/compliance/:nocId/issue-notice** | **Issue violation notice** ⭐ NEW |
| GET | `/nocs` | Active NOCs (alternative to /compliance) |
| POST | `/nocs/:id/revoke` | Revoke NOC |
| POST | `/inspections/schedule` | Schedule inspection |
| POST | `/violations/warning` | Issue warning |
| POST | `/violations/penalty` | Impose penalty |
| POST | `/complaints/register` | Register complaint |

---

## Compliance Status Values
- `COMPLIANT` - All requirements met
- `NON_COMPLIANT` - Violations detected
- `NOTICE_ISSUED` - Warning issued, awaiting correction

## Violation Types
- `OVER_EXTRACTION` - Exceeded approved limits
- `DELAYED_REPORTING` - Late submission of reports
- `METER_MALFUNCTION` - Flow meter issues
- `UNAUTHORIZED_EXTRACTION` - Operating without NOC
