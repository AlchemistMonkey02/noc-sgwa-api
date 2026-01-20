# DGO Officer - Complete Workflow Guide
## From Login to Application Approval

This guide shows the complete DGO workflow in the correct order.

---

## STEP 1: Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dgo_admin","password":"password123"}'
```

**Save the token from response!**

---

## STEP 2: View Dashboard

```bash
curl -X GET http://localhost:5000/api/officer/dgo/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## STEP 3: Get Applications List

```bash
curl -X GET http://localhost:5000/api/officer/dgo/applications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Copy an applicationId or trackingId from response!**

---

## STEP 4: Get Application Details

```bash
# By application ID
curl -X GET http://localhost:5000/api/officer/dgo/applications/APP_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# OR by tracking ID
curl -X GET http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## STEP 5: Get All Documents for Application

```bash
# Get ONLY documents (no application data)
curl -X GET "http://localhost:5000/api/documents/tracking/REF-20260110-6106?documentsOnly=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Copy document IDs from response for verification!**

---

## STEP 6: Verify Each Document Individually

```bash
# Verify Document 1 - APPROVE
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOC_ID_1/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Land ownership proof verified"}'

# Verify Document 2 - APPROVE
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOC_ID_2/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Project proposal verified"}'

# Verify Document 3 - APPROVE
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOC_ID_3/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Environmental clearance verified"}'

# If document needs rejection
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOC_ID_X/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"REJECTED","remarks":"Document is unclear, please reupload higher quality scan"}'
```

---

## STEP 7: Verify Documents (Legacy - Bulk Verification)

```bash
# Alternative: Verify all documents at once (old method)
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/verify-documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentsVerified": true,
    "remarks": "All documents verified",
    "verifiedDocuments": ["LAND_OWNERSHIP_PROOF", "PROJECT_PROPOSAL", "ENVIRONMENTAL_CLEARANCE"],
    "missingDocuments": []
  }'
```

---

## STEP 8: Schedule Inspection (Optional)

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/schedule-inspection \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectorId": "INSPECTOR_001",
    "inspectionDate": "2026-02-01",
    "purpose": "Site verification and borewell inspection",
    "checkpoints": [
      "Verify proposed borewell location",
      "Check land ownership on-site",
      "Verify water requirement calculations"
    ]
  }'
```

---

## STEP 9: View Inspection Report (If Inspection Done)

```bash
curl -X GET http://localhost:5000/api/officer/dgo/inspections/APP_ID/report \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## STEP 10: Raise Query (If Needed)

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Water Requirement Clarification",
    "question": "Please provide detailed breakdown of water consumption",
    "category": "TECHNICAL",
    "deadline": "2026-02-15"
  }'
```

---

## STEP 11: Approve Application (Forward to SGWA)

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation": "RECOMMENDED",
    "technicalReview": "Application meets all technical requirements. Proposed extraction within sustainable limits.",
    "conditions": [
      "Install digital flow meter with telemetry within 30 days",
      "Implement rainwater harvesting system",
      "Submit quarterly compliance reports"
    ],
    "remarks": "Documents verified. Inspection report positive. Recommend approval."
  }'
```

---

## ALTERNATIVE: Reject Application

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "TECHNICAL_NON_COMPLIANCE",
    "remarks": "Proposed extraction exceeds sustainable yield. Area is Over-Exploited.",
    "details": "Cannot issue NOC in over-exploited areas as per CGWA guidelines."
  }'
```

---

## Complete Workflow Summary

```
1. LOGIN → Get Token
2. VIEW DASHBOARD → See stats
3. GET APPLICATIONS → List pending applications
4. GET APPLICATION DETAILS → View full application
5. GET DOCUMENTS → Get all documents by tracking ID
6. VERIFY EACH DOCUMENT → Approve/reject individual documents
7. (Optional) SCHEDULE INSPECTION → Assign to inspector
8. (Optional) VIEW INSPECTION REPORT → Review findings
9. (Optional) RAISE QUERY → If clarification needed
10. APPROVE APPLICATION → Forward to SGWA ✅
    OR
    REJECT APPLICATION → With reason ❌
```

---

## PowerShell Script - Complete Workflow

```powershell
# 1. Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"dgo.jaipur@rajasthan.gov.in","password":"dgo123"}'

$TOKEN = $loginResponse.data.token
Write-Host "Logged in. Token: $TOKEN"

# 2. Get Applications
$apps = Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/applications" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $TOKEN"}

Write-Host "Found $($apps.data.applications.Count) applications"

# Use first application
$APP_ID = $apps.data.applications[0].applicationId
$TRACKING_ID = $apps.data.applications[0].trackingId
Write-Host "Working with: $TRACKING_ID"

# 3. Get Application Details
$appDetails = Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/applications/$APP_ID" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $TOKEN"}

# 4. Get Documents
$docs = Invoke-RestMethod -Uri "http://localhost:5000/api/documents/tracking/${TRACKING_ID}?documentsOnly=true" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $TOKEN"}

Write-Host "Found $($docs.data.Count) documents"

# 5. Verify each document
foreach ($doc in $docs.data) {
    $verifyBody = @{
        status = "APPROVED"
        remarks = "Document verified"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/documents/$($doc.documentId)/verify" `
      -Method POST `
      -Headers @{"Authorization"="Bearer $TOKEN"; "Content-Type"="application/json"} `
      -Body $verifyBody
    
    Write-Host "Verified: $($doc.documentType)"
}

# 6. Approve Application
$approveBody = @{
    recommendation = "RECOMMENDED"
    remarks = "All documents verified. Recommend approval."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/applications/$APP_ID/approve" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $TOKEN"; "Content-Type"="application/json"} `
  -Body $approveBody

Write-Host "Application approved and forwarded to SGWA!"
```

---

## Key Points

1. **Document Verification**: Now done individually by document ID (Step 6)
2. **Three-Way Verification**: Each document is verified by DGO, SGWA, and Enforcement separately
3. **Inspection**: Optional - can be scheduled if site visit needed
4. **Query System**: Can raise queries at any stage before approval
5. **Final Action**: Either APPROVE (forwards to SGWA) or REJECT

---

## API Endpoints Used

| Step | Endpoint | Method |
|------|----------|--------|
| 1 | `/api/auth/login` | POST |
| 2 | `/api/officer/dgo/dashboard` | GET |
| 3 | `/api/officer/dgo/applications` | GET |
| 4 | `/api/officer/dgo/applications/:id` | GET |
| 5 | `/api/documents/tracking/:trackingId?documentsOnly=true` | GET |
| 6 | `/api/officer/dgo/documents/:documentId/verify` | POST |
| 7 | `/api/officer/dgo/applications/:id/verify-documents` | POST |
| 8 | `/api/officer/dgo/applications/:id/schedule-inspection` | POST |
| 9 | `/api/officer/dgo/inspections/:id/report` | GET |
| 10 | `/api/officer/dgo/applications/:id/query` | POST |
| 11 | `/api/officer/dgo/applications/:id/approve` | POST |
| Alt | `/api/officer/dgo/applications/:id/reject` | POST |
