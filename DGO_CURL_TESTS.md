# DGO API - Step-by-Step cURL Tests

## Prerequisites
- Server running at: http://localhost:5000
- DGO credentials: dgo.jaipur@rajasthan.gov.in / dgo123

---

## STEP 1: Login as DGO Officer

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"dgo.jaipur@rajasthan.gov.in\",\"password\":\"dgo123\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

**💡 COPY THE TOKEN** and replace `YOUR_TOKEN_HERE` in all commands below!

---

## STEP 2: Test Dashboard

```bash
curl -X GET http://localhost:5000/api/officer/dgo/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## STEP 3: Get Applications List

```bash
curl -X GET http://localhost:5000/api/officer/dgo/applications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**💡 COPY AN APPLICATION ID** from the response for next tests!

---

## STEP 4: Get Application Details

Replace `APP_ID` with actual application ID from Step 3:

```bash
curl -X GET http://localhost:5000/api/officer/dgo/applications/APP_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## STEP 5: Verify Documents

Replace `APP_ID` with actual application ID:

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/verify-documents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"documentsVerified\":true,\"remarks\":\"All documents verified\",\"verifiedDocuments\":[\"LAND_OWNERSHIP_PROOF\",\"PROJECT_PROPOSAL\"],\"missingDocuments\":[]}"
```

---

## STEP 6: Schedule Inspection

Replace `APP_ID` with actual application ID:

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/schedule-inspection \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"inspectorId\":\"INSPECTOR_001\",\"inspectionDate\":\"2026-02-01\",\"purpose\":\"Site verification\",\"checkpoints\":[\"Verify location\",\"Check documents\"]}"
```

---

## STEP 7: Get Inspection Report

Replace `APP_ID` with actual application ID:

```bash
curl -X GET http://localhost:5000/api/officer/dgo/inspections/APP_ID/report \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Note:** This will return 404 if inspection not completed yet.

---

## STEP 8: Raise Query

Replace `APP_ID` with actual application ID:

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/query \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"subject\":\"Water Requirement Clarification\",\"question\":\"Please provide detailed breakdown\",\"category\":\"TECHNICAL\",\"deadline\":\"2026-02-10\"}"
```

---

## STEP 9: Get All Queries

```bash
curl -X GET http://localhost:5000/api/officer/dgo/queries \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## STEP 10: Get Query Details

Replace `QUERY_ID` with actual query ID from Step 9:

```bash
curl -X GET http://localhost:5000/api/officer/dgo/queries/QUERY_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## STEP 11: Accept Query Response

Replace `QUERY_ID` with actual query ID:

```bash
curl -X POST http://localhost:5000/api/officer/dgo/queries/QUERY_ID/accept \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"remarks\":\"Response satisfactory\"}"
```

---

## STEP 12: Approve Application

Replace `APP_ID` with actual application ID:

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/approve \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"recommendation\":\"RECOMMENDED\",\"technicalReview\":\"Application meets requirements\",\"conditions\":[\"Install flow meter\"],\"remarks\":\"Recommend approval\"}"
```

---

## STEP 13: Reject Application (Alternative)

Replace `APP_ID` with actual application ID:

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/reject \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"reason\":\"TECHNICAL_NON_COMPLIANCE\",\"remarks\":\"Area is over-exploited\",\"details\":\"Cannot issue NOC in over-exploited areas\"}"
```

---

## STEP 14: Get Compliance Report

```bash
curl -X GET "http://localhost:5000/api/officer/dgo/compliance-report?fromDate=2026-01-01&toDate=2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## STEP 15: Get Statistics (Alternative)

```bash
curl -X GET http://localhost:5000/api/officer/dgo/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Quick Test Sequence (Copy-Paste Block)

**After getting token from Step 1, replace TOKEN and APP_ID below:**

```bash
# Set variables
export TOKEN="YOUR_TOKEN_HERE"
export APP_ID="YOUR_APP_ID_HERE"

# 1. Dashboard
curl -X GET http://localhost:5000/api/officer/dgo/dashboard -H "Authorization: Bearer $TOKEN"

# 2. Get Applications
curl -X GET http://localhost:5000/api/officer/dgo/applications -H "Authorization: Bearer $TOKEN"

# 3. Get Application Details
curl -X GET http://localhost:5000/api/officer/dgo/applications/$APP_ID -H "Authorization: Bearer $TOKEN"

# 4. Verify Documents
curl -X POST http://localhost:5000/api/officer/dgo/applications/$APP_ID/verify-documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentsVerified":true,"remarks":"Test verification","verifiedDocuments":["LAND_OWNERSHIP_PROOF"]}'

# 5. Schedule Inspection
curl -X POST http://localhost:5000/api/officer/dgo/applications/$APP_ID/schedule-inspection \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inspectorId":"INSPECTOR_001","inspectionDate":"2026-02-01","purpose":"Site verification"}'

# 6. Approve
curl -X POST http://localhost:5000/api/officer/dgo/applications/$APP_ID/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recommendation":"RECOMMENDED","remarks":"Approve"}'
```

---

## PowerShell Version (Windows)

```powershell
# Step 1: Login
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"dgo.jaipur@rajasthan.gov.in","password":"dgo123"}'

$TOKEN = $response.data.token
Write-Host "Token: $TOKEN"

# Step 2: Dashboard
Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/dashboard" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $TOKEN"} | ConvertTo-Json -Depth 10

# Step 3: Get Applications
$apps = Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/applications" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $TOKEN"}

Write-Host "Applications found: $($apps.data.applications.Count)"
$apps | ConvertTo-Json -Depth 10

# Get first application ID
if ($apps.data.applications.Count -gt 0) {
    $APP_ID = $apps.data.applications[0].applicationId
    Write-Host "Using Application ID: $APP_ID"
    
    # Step 4: Get Details
    Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/applications/$APP_ID" `
      -Method GET `
      -Headers @{"Authorization"="Bearer $TOKEN"} | ConvertTo-Json -Depth 10
    
    # Step 5: Verify Documents
    $verifyBody = @{
        documentsVerified = $true
        remarks = "Test verification"
        verifiedDocuments = @("LAND_OWNERSHIP_PROOF")
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/applications/$APP_ID/verify-documents" `
      -Method POST `
      -Headers @{"Authorization"="Bearer $TOKEN"; "Content-Type"="application/json"} `
      -Body $verifyBody | ConvertTo-Json -Depth 10
}
```

---

## Troubleshooting

### Issue: "Authentication required"
**Solution:** Token is missing or invalid. Re-run Step 1 to get a fresh token.

### Issue: "Application not found"
**Solution:** Use correct application ID from Step 3 response.

### Issue: "Forbidden - district mismatch"
**Solution:** Application doesn't belong to DGO's district. Try another application.

### Issue: No applications returned
**Solution:** 
1. Create test applications via user API
2. Or check if applications exist for this district in database

---

## Expected Test Flow

1. ✅ Login → Get token
2. ✅ Dashboard → See stats
3. ✅ List apps → Get application IDs
4. ✅ View app details → See full application
5. ✅ Verify docs → Mark documents as verified
6. ✅ Schedule inspection → Assign to inspector
7. ✅ Raise query (optional) → Ask for clarifications
8. ✅ Approve → Forward to SGWA

**Total time: ~2-3 minutes**
