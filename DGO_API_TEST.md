# DGO Officer API - cURL Test Script

## Prerequisites
1. Server running at http://localhost:5000
2. DGO officer credentials (see OFFICER_CREDENTIALS.md)

---

## Step 1: Login as DGO Officer

```bash
# Login to get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dgo.jaipur@rajasthan.gov.in",
    "password": "dgo123"
  }'
```

**Save the token from response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

**Set Token as Environment Variable (Bash/Linux/Mac):**
```bash
export DGO_TOKEN="YOUR_TOKEN_HERE"
```

**PowerShell:**
```powershell
$DGO_TOKEN = "YOUR_TOKEN_HERE"
```

---

## Step 2: Test Dashboard

```bash
# Get Dashboard Stats
curl -X GET http://localhost:5000/api/officer/dgo/dashboard \
  -H "Authorization: Bearer $DGO_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalApplications": 45,
      "pendingReview": 8,
      "approved": 30,
      "rejected": 5
    }
  }
}
```

---

## Step 3: Get Applications List

```bash
# Get all pending applications
curl -X GET "http://localhost:5000/api/officer/dgo/applications?status=PENDING_DGO_REVIEW&page=1&limit=10" \
  -H "Authorization: Bearer $DGO_TOKEN"
```

**Get all applications (no filter):**
```bash
curl -X GET http://localhost:5000/api/officer/dgo/applications \
  -H "Authorization: Bearer $DGO_TOKEN"
```

---

## Step 4: Get Application Details

**Replace APP_ID with actual application ID from previous response:**

```bash
# Using application UUID
curl -X GET http://localhost:5000/api/officer/dgo/applications/APP_ID_HERE \
  -H "Authorization: Bearer $DGO_TOKEN"
```

**Or using tracking ID:**
```bash
curl -X GET http://localhost:5000/api/officer/dgo/applications/TRACK_ID_HERE \
  -H "Authorization: Bearer $DGO_TOKEN"
```

---

## Step 5: Verify Documents

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/verify-documents \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentsVerified": true,
    "remarks": "All documents verified successfully",
    "verifiedDocuments": [
      "LAND_OWNERSHIP_PROOF",
      "PROJECT_PROPOSAL",
      "ENVIRONMENTAL_CLEARANCE"
    ],
    "missingDocuments": []
  }'
```

---

## Step 6: Schedule Inspection

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/schedule-inspection \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectionDate": "2026-02-01",
    "inspectorId": "INSPECTOR_001",
    "purpose": "Site verification and borewell inspection",
    "checkpoints": [
      "Verify proposed borewell location",
      "Check land ownership on-site",
      "Verify water requirement calculations"
    ]
  }'
```

---

## Step 7: Raise Query

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/query \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Water Requirement Clarification",
    "question": "Please provide detailed breakdown of industrial water consumption",
    "category": "TECHNICAL",
    "documents": ["WATER_AUDIT_REPORT"],
    "deadline": "2026-02-10"
  }'
```

---

## Step 8: View Queries

```bash
# Get all queries raised by this DGO
curl -X GET http://localhost:5000/api/officer/dgo/queries \
  -H "Authorization: Bearer $DGO_TOKEN"
```

```bash
# Get specific query
curl -X GET http://localhost:5000/api/officer/dgo/queries/QUERY_ID \
  -H "Authorization: Bearer $DGO_TOKEN"
```

---

## Step 9: Accept Query Response

```bash
curl -X POST http://localhost:5000/api/officer/dgo/queries/QUERY_ID/accept \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "Response satisfactory, all documents provided"
  }'
```

---

## Step 10: Approve Application

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/approve \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation": "RECOMMENDED",
    "technicalReview": "Application meets all technical requirements. Proposed extraction is within sustainable limits.",
    "conditions": [
      "Install digital flow meter with telemetry within 30 days",
      "Implement rainwater harvesting system",
      "Submit quarterly compliance reports"
    ],
    "remarks": "Recommend approval subject to standard CGWA conditions"
  }'
```

---

## Step 11: Reject Application (Alternative)

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/reject \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "TECHNICAL_NON_COMPLIANCE",
    "remarks": "Proposed extraction exceeds sustainable yield. Area is Over-Exploited as per CGWA classification.",
    "details": "Cannot issue NOC in over-exploited areas as per CGWA guidelines"
  }'
```

---

## Step 12: Get Inspection Report

```bash
curl -X GET http://localhost:5000/api/officer/dgo/inspections/APP_ID/report \
  -H "Authorization: Bearer $DGO_TOKEN"
```

---

## Step 13: Submit Inspection Report

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/inspection-report \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectionDate": "2026-02-01",
    "siteVerified": true,
    "findings": "Site matches application details. Proposed location suitable for borewell.",
    "recommendations": "Approve with standard conditions",
    "photos": ["photo1.jpg", "photo2.jpg"],
    "geoLocation": {
      "latitude": 26.9124,
      "longitude": 75.7873
    }
  }'
```

---

## Complete Test Sequence (Bash Script)

```bash
#!/bin/bash

# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dgo.jaipur@rajasthan.gov.in","password":"dgo123"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. Get Dashboard
echo -e "\n=== Dashboard ==="
curl -s -X GET http://localhost:5000/api/officer/dgo/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Get Applications
echo -e "\n=== Applications ==="
curl -s -X GET http://localhost:5000/api/officer/dgo/applications \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Get first application ID
APP_ID=$(curl -s -X GET http://localhost:5000/api/officer/dgo/applications \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data.applications[0].applicationId')

echo -e "\nTesting with Application ID: $APP_ID"

# 5. Get Application Details
echo -e "\n=== Application Details ==="
curl -s -X GET "http://localhost:5000/api/officer/dgo/applications/$APP_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# 6. Verify Documents
echo -e "\n=== Verify Documents ==="
curl -s -X POST "http://localhost:5000/api/officer/dgo/applications/$APP_ID/verify-documents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentsVerified": true,
    "remarks": "Test verification - all documents OK",
    "verifiedDocuments": ["LAND_OWNERSHIP_PROOF"]
  }' | jq

echo -e "\nTest completed!"
```

**To run the bash script:**
```bash
chmod +x test-dgo-api.sh
./test-dgo-api.sh
```

---

## PowerShell Test Sequence

```powershell
# 1. Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"dgo.jaipur@rajasthan.gov.in","password":"dgo123"}'

$TOKEN = $loginResponse.data.token
Write-Host "Token: $TOKEN"

# 2. Get Dashboard
Write-Host "`n=== Dashboard ==="
$headers = @{ "Authorization" = "Bearer $TOKEN" }
Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/dashboard" `
  -Method GET -Headers $headers | ConvertTo-Json -Depth 10

# 3. Get Applications
Write-Host "`n=== Applications ==="
$apps = Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/applications" `
  -Method GET -Headers $headers
$apps | ConvertTo-Json -Depth 10

# 4. Test with first application
if ($apps.data.applications.Count -gt 0) {
    $APP_ID = $apps.data.applications[0].applicationId
    Write-Host "`nTesting with Application ID: $APP_ID"
    
    # Get details
    Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/applications/$APP_ID" `
      -Method GET -Headers $headers | ConvertTo-Json -Depth 10
}
```

---

## Quick Health Check

```bash
# Check if DGO routes are working
curl -X GET http://localhost:5000/api/officer/dgo/ping \
  -H "Authorization: Bearer $DGO_TOKEN"
```

**Expected:**
```json
{
  "message": "DGO Routes Active",
  "version": "v_probe_1",
  "timestamp": "2026-01-18T09:00:00.000Z"
}
```

---

## Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Solution:** Token expired or invalid. Login again to get fresh token.

### Issue 2: 403 Forbidden
**Solution:** User doesn't have DGO role. Check user role in database.

### Issue 3: 404 Not Found - Application
**Solution:** Use correct applicationId or trackingId from the applications list.

### Issue 4: Empty Applications List
**Solution:** 
1. Create test applications via user API
2. Or use seeder to populate test data
3. Check district assignment matches DGO's district
