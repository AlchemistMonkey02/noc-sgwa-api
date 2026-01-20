# DGO Test Commands - With Real IDs

**Use these commands to test with actual data from your database**

---

## 1. LOGIN

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dgo_admin","password":"password123"}'
```

**Copy the token from response and replace TOKEN below!**

---

## 2. GET APPLICATION DETAILS (By Application ID)

```bash
curl -X GET "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85" \
  -H "Authorization: Bearer TOKEN"
```

---

## 3. GET APPLICATION DETAILS (By Tracking ID)

```bash
curl -X GET "http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106" \
  -H "Authorization: Bearer TOKEN"
```

---

## 4. GET ALL DOCUMENTS (ONLY Documents, No App Data)

```bash
curl -X GET "http://localhost:5000/api/documents/tracking/REF-20260110-6106?documentsOnly=true" \
  -H "Authorization: Bearer TOKEN"
```

**This will return 7 documents - copy the documentId values!**

---

## 5. VERIFY DOCUMENTS (Legacy - Bulk Method)

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/verify-documents" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentsVerified": true,
    "remarks": "All documents verified and approved",
    "verifiedDocuments": [
      "LAND_OWNERSHIP_PROOF",
      "PROJECT_PROPOSAL",
      "ENVIRONMENTAL_CLEARANCE",
      "WATER_AUDIT_REPORT",
      "SITE_PLAN",
      "BUILDING_PLAN",
      "NOC_DOCUMENTS"
    ],
    "missingDocuments": []
  }'
```

---

## 6. VERIFY INDIVIDUAL DOCUMENT (New Method)

**First get document IDs from step 4, then verify each:**

```bash
# Example - Replace ACTUAL_DOC_ID with real documentId from step 4 response
curl -X POST "http://localhost:5000/api/officer/dgo/documents/ACTUAL_DOC_ID/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "remarks": "Document verified successfully"
  }'
```

---

## 7. SCHEDULE INSPECTION

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/schedule-inspection" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectorId": "INSPECTOR_001",
    "inspectionDate": "2026-02-01",
    "purpose": "Site verification for NOC/RAJ/2026/00001",
    "checkpoints": [
      "Verify proposed borewell location",
      "Check land ownership documents",
      "Verify water requirement calculations"
    ]
  }'
```

---

## 8. APPROVE APPLICATION

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/approve" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation": "RECOMMENDED",
    "technicalReview": "Application NOC/RAJ/2026/00001 meets all technical requirements. Infrastructure project with proper documentation.",
    "conditions": [
      "Install digital flow meter with telemetry",
      "Implement rainwater harvesting system",
      "Submit quarterly compliance reports"
    ],
    "remarks": "All 7 documents verified. Inspection completed. Recommend approval and forward to SGWA."
  }'
```

---

## Real Data Reference

**Application:**
- Application ID: `5a2646fa-324f-45dc-88b8-5097e03d3b85`
- Tracking ID: `REF-20260110-6106`
- Application Number: `NOC/RAJ/2026/00001`
- Status: `INSPECTION_SCHEDULED`
- Type: Infrastructure Project
- Category: WITHDRAWAL (MINOR)
- Documents: 7 uploaded

---

## Quick Test Sequence

```bash
# 1. Login (copy token)
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dgo_admin","password":"password123"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. Get application details
curl -X GET "http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106" \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Get documents
curl -X GET "http://localhost:5000/api/documents/tracking/REF-20260110-6106?documentsOnly=true" \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Verify documents (bulk)
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/verify-documents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentsVerified":true,"remarks":"All verified","verifiedDocuments":["LAND_OWNERSHIP_PROOF","PROJECT_PROPOSAL"]}'

# 5. Approve
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recommendation":"RECOMMENDED","remarks":"Approved"}'
```

---

## PowerShell Quick Test

```powershell
# 1. Login
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"dgo_admin","password":"password123"}'

$TOKEN = $response.data.token
Write-Host "Logged in! Token: $TOKEN"

# 2. Get application
Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106" `
  -Headers @{"Authorization"="Bearer $TOKEN"} | ConvertTo-Json -Depth 10

# 3. Get documents
$docs = Invoke-RestMethod -Uri "http://localhost:5000/api/documents/tracking/REF-20260110-6106?documentsOnly=true" `
  -Headers @{"Authorization"="Bearer $TOKEN"}

Write-Host "Found $($docs.data.Count) documents"

# 4. Approve
Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/approve" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $TOKEN"; "Content-Type"="application/json"} `
  -Body '{"recommendation":"RECOMMENDED","remarks":"Approved by DGO"}'
```
