# Officer Portal API cURL Requests

Use these commands to test the Officer Portal APIs. 

**Prerequisites:**
1. **Login** as an officer (DGO, SGWA, or Enforcement) to get an `accessToken`.
2. Replace `{{TOKEN}}` with your actual JWT token.
3. Replace `{{BASE_URL}}` with `http://localhost:3000` (or your server URL).
4. Replace `{{APPLICATION_ID}}` with a valid application ID from your database.

---

## 1. Authentication (Get Token)

### Login as Officer
Replace `username` and `password` with valid officer credentials.
```bash
curl -X POST "{{BASE_URL}}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "officer_dgo",
    "password": "password123",
    "role": "DGO" 
  }'
```
*(Store the `accessToken` from the response for subsequent requests)*

---

## 2. Common Officer APIs (All Roles)

### Get Profile
```bash
curl -X GET "{{BASE_URL}}/api/officer/common/profile" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### Update Profile
```bash
curl -X PUT "{{BASE_URL}}/api/officer/common/profile" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "contactNumber": "9876543210"
  }'
```

### Change Password
```bash
curl -X POST "{{BASE_URL}}/api/officer/common/change-password" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword123"
  }'
```

### Mark Notification Read
```bash
curl -X PUT "{{BASE_URL}}/api/officer/common/notifications/{{NOTIFICATION_ID}}/read" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### Get Activity Log
```bash
curl -X GET "{{BASE_URL}}/api/officer/common/activity-log" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### Get Master Data (Officer)
```bash
curl -X GET "{{BASE_URL}}/api/officer/common/master-data/violation-types" \
  -H "Authorization: Bearer {{TOKEN}}"
```

---

## 3. SGWA Officer APIs

### Get Dashboard Stats
```bash
curl -X GET "{{BASE_URL}}/api/officer/sgwa/dashboard" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### List Applications (Pending Review)
```bash
curl -X GET "{{BASE_URL}}/api/officer/sgwa/applications?status=PENDING_SGWA_REVIEW" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### Get Application Details
```bash
curl -X GET "{{BASE_URL}}/api/officer/sgwa/applications/{{APPLICATION_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### Assign Application
Assign an application to another officer (or self).
```bash
curl -X POST "{{BASE_URL}}/api/officer/sgwa/applications/{{APPLICATION_ID}}/assign" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "officerId": "{{TARGET_OFFICER_ID}}",
    "remarks": "Assigned for technical review"
  }'
```

### Approve Application
```bash
curl -X POST "{{BASE_URL}}/api/officer/sgwa/applications/{{APPLICATION_ID}}/approve" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "Technical review completed. Recommended for approval.",
    "recommendation": "APPROVE",
    "validityYears": 3,
    "conditions": ["Install telemetry", "Submit yearly audit"]
  }'
```

### Reject Application
```bash
curl -X POST "{{BASE_URL}}/api/officer/sgwa/applications/{{APPLICATION_ID}}/reject" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "Documents incomplete.",
    "recommendation": "REJECT"
  }'
```

### Raise Query
```bash
curl -X POST "{{BASE_URL}}/api/officer/sgwa/applications/{{APPLICATION_ID}}/query" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Missing Annexure",
    "query": "Please provide Annexure A.",
    "priority": "HIGH",
    "responseDeadline": "2026-02-01"
  }'
```

### Generate Report
```bash
curl -X POST "{{BASE_URL}}/api/officer/sgwa/reports/generate" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "MONTHLY_SUMMARY",
    "month": 1,
    "year": 2026
  }'
```

---

## 4. DGO (District) Officer APIs

### Get Dashboard Stats
```bash
curl -X GET "{{BASE_URL}}/api/officer/dgo/stats" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### List Applications
```bash
curl -X GET "{{BASE_URL}}/api/officer/dgo/applications?status=PENDING_DGO_REVIEW" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### Get Application Details
```bash
curl -X GET "{{BASE_URL}}/api/officer/dgo/applications/{{APPLICATION_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### Schedule Inspection
```bash
curl -X POST "{{BASE_URL}}/api/officer/dgo/applications/{{APPLICATION_ID}}/schedule-inspection" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectionDate": "2026-02-15T10:00:00Z",
    "remarks": "Site verification required."
  }'
```

### Submit Inspection Report
```bash
curl -X POST "{{BASE_URL}}/api/officer/dgo/applications/{{APPLICATION_ID}}/inspection-report" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "findings": {
        "siteVerified": true,
        "borewellCountMatch": true,
        "rainwaterHarvestingImplemented": true
    },
    "recommendation": "APPROVE"
  }'
```

### Approve Application
```bash
curl -X POST "{{BASE_URL}}/api/officer/dgo/applications/{{APPLICATION_ID}}/approve" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "Verified and approved at district level.",
    "recommendation": "FORWARD_TO_SGWA"
  }'
```

### Reject Application
```bash
curl -X POST "{{BASE_URL}}/api/officer/dgo/applications/{{APPLICATION_ID}}/reject" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "Site conditions do not match proposal.",
    "recommendation": "REJECT"
  }'
```

### Raise Query
```bash
curl -X POST "{{BASE_URL}}/api/officer/dgo/applications/{{APPLICATION_ID}}/query" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Location Discrepancy",
    "query": "GPS coordinates do not match address.",
    "priority": "MEDIUM"
  }'
```

---

## 5. Enforcement Wing APIs

### Get Active NOCs (Monitoring)
```bash
curl -X GET "{{BASE_URL}}/api/officer/enforcement/active-nocs" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### Get Application List
```bash
curl -X GET "{{BASE_URL}}/api/officer/enforcement/applications" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### Schedule Compliance Inspection
```bash
curl -X POST "{{BASE_URL}}/api/officer/enforcement/inspections/schedule" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "nocId": "{{NOC_ID}}",
    "inspectionDate": "2026-03-01T10:00:00Z",
    "remarks": "Routine compliance check"
  }'
```

### Submit Compliance Report
```bash
curl -X POST "{{BASE_URL}}/api/officer/enforcement/inspections/{{INSPECTION_ID}}/report" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLIANT",
    "findings": "All conditions met."
  }'
```

### Issue Warning (Violation)
```bash
curl -X POST "{{BASE_URL}}/api/officer/enforcement/violations/warning" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "{{APPLICATION_ID}}",
    "violationType": "NON_COMPLIANCE_CONDITIONS",
    "description": "Telemetry data not submitted for 30 days."
  }'
```

### Impose Penalty
```bash
curl -X POST "{{BASE_URL}}/api/officer/enforcement/violations/penalty" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "{{APPLICATION_ID}}",
    "violationType": "EXCESS_EXTRACTION",
    "amount": 50000,
    "description": "Extracted 20% more than approved limit."
  }'
```

### Initiate Cancellation
```bash
curl -X POST "{{BASE_URL}}/api/officer/enforcement/noc/{{NOC_ID}}/initiate-cancellation" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Repeated violations."
  }'
```

### Register Complaint
```bash
curl -X POST "{{BASE_URL}}/api/officer/enforcement/complaints/register" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Illegal Borewell Drilling",
    "description": "Unauthorized drilling observed near industrial area.",
    "complainantName": "Anonymous", // Optional
    "location": {
        "districtId": "JAIPUR",
        "address": "Sitapura Industrial Area"
    }
  }'
```

### View Complaint
```bash
curl -X GET "{{BASE_URL}}/api/officer/enforcement/complaints/{{COMPLAINT_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### Update Complaint Status
```bash
curl -X PUT "{{BASE_URL}}/api/officer/enforcement/complaints/{{COMPLAINT_ID}}/status" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "RESOLVED",
    "remarks": "Investigation completed. No violation found."
  }'
```

### Approve & Issue NOC (Final Step)
```bash
curl -X POST "{{BASE_URL}}/api/officer/enforcement/applications/{{APPLICATION_ID}}/approve" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "Final approval granted.",
    "validFrom": "2026-01-01",
    "validUpto": "2029-01-01",
    "maxDailyExtraction": 100,
    "maxAnnualExtraction": 36500,
    "approvedBy": "{{OFFICER_ID}}"
  }'
```

### Reject Application
```bash
curl -X POST "{{BASE_URL}}/api/officer/enforcement/applications/{{APPLICATION_ID}}/reject" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "Serious compliance failure.",
    "recommendation": "REJECT"
  }'
```

### Raise Query
```bash
curl -X POST "{{BASE_URL}}/api/officer/enforcement/applications/{{APPLICATION_ID}}/query" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Missing flow meter details",
    "query": "Please provide make and model of flow meter.",
    "priority": "HIGH"
  }'
```
