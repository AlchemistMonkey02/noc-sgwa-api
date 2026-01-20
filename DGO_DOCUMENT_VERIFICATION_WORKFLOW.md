# DGO Complete Test Workflow - See Applications & Verify Documents

## Step-by-Step: From Login to Document Verification

---

## STEP 1: Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dgo_admin","password":"password123"}'
```

**→ COPY THE TOKEN!**

---

## STEP 2: See All Applications

```bash
curl -X GET http://localhost:5000/api/officer/dgo/applications \
  -H "Authorization: Bearer TOKEN"
```

**Response shows:**
- Application IDs
- Tracking IDs
- Status
- Basic info

**→ COPY AN APPLICATION ID from response!**

---

## STEP 3: Get Application Details WITH Documents

```bash
curl -X GET "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85" \
  -H "Authorization: Bearer TOKEN"
```

**Response includes:**
- Full application details
- `documents` array with all uploaded documents
- Each document has: `_id`, `documentType`, `originalFilename`, etc.

---

## STEP 4: Get ONLY Documents (Alternative)

```bash
curl -X GET "http://localhost:5000/api/documents/tracking/REF-20260110-6106?documentsOnly=true" \
  -H "Authorization: Bearer TOKEN"
```

**Response shows array of documents with:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "69623e...",
      "documentId": "uuid-here",
      "documentType": "LAND_OWNERSHIP_PROOF",
      "originalFilename": "land_deed.pdf",
      "verification": {
        "dgo": { "status": "PENDING", "verified": false },
        "sgwa": { "status": "PENDING", "verified": false },
        "enforcement": { "status": "PENDING", "verified": false }
      }
    }
  ]
}
```

**→ COPY DOCUMENT IDs from response!**

---

## STEP 5: Verify Individual Documents (NEW METHOD - Three-Way Verification)

### Verify Document 1
```bash
curl -X POST "http://localhost:5000/api/officer/dgo/documents/DOCUMENT_ID_1/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "remarks": "Land ownership proof verified successfully"
  }'
```

### Verify Document 2
```bash
curl -X POST "http://localhost:5000/api/officer/dgo/documents/DOCUMENT_ID_2/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "remarks": "Project proposal verified"
  }'
```

### Reject a Document
```bash
curl -X POST "http://localhost:5000/api/officer/dgo/documents/DOCUMENT_ID_X/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "remarks": "Document is unclear, please reupload"
  }'
```

---

## STEP 6: Verify All Documents (LEGACY METHOD - Bulk)

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/verify-documents" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentsVerified": true,
    "remarks": "All documents verified",
    "verifiedDocuments": [
      "LAND_OWNERSHIP_PROOF",
      "PROJECT_PROPOSAL",
      "ENVIRONMENTAL_CLEARANCE"
    ],
    "missingDocuments": []
  }'
```

---

## STEP 7: Approve Application (After Document Verification)

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/approve" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation": "RECOMMENDED",
    "remarks": "All documents verified. Application approved."
  }'
```

---

## Complete Test Script (Bash)

```bash
#!/bin/bash

# 1. Login
echo "=== Logging in ==="
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dgo_admin","password":"password123"}')

TOKEN=$(echo $RESPONSE | jq -r '.data.token')
echo "Token: $TOKEN"

# 2. Get applications
echo -e "\n=== Getting Applications ===" 
curl -s -X GET http://localhost:5000/api/officer/dgo/applications \
  -H "Authorization: Bearer $TOKEN" | jq '.data.applications[] | {applicationId, trackingId, status}'

# 3. Get application details
APP_ID="5a2646fa-324f-45dc-88b8-5097e03d3b85"
echo -e "\n=== Getting Application Details ==="
curl -s -X GET "http://localhost:5000/api/officer/dgo/applications/$APP_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | {applicationNumber, status, documents: .documents | length}'

# 4. Get documents
TRACKING_ID="REF-20260110-6106"
echo -e "\n=== Getting Documents ==="
DOCS=$(curl -s -X GET "http://localhost:5000/api/documents/tracking/$TRACKING_ID?documentsOnly=true" \
  -H "Authorization: Bearer $TOKEN")

echo $DOCS | jq '.data[] | {documentId, documentType, verification}'

# 5. Verify first document
DOC_ID=$(echo $DOCS | jq -r '.data[0].documentId')
echo -e "\n=== Verifying Document: $DOC_ID ==="
curl -s -X POST "http://localhost:5000/api/officer/dgo/documents/$DOC_ID/verify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Verified"}' | jq

# 6. Approve application
echo -e "\n=== Approving Application ==="
curl -s -X POST "http://localhost:5000/api/officer/dgo/applications/$APP_ID/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recommendation":"RECOMMENDED","remarks":"Approved"}' | jq

echo -e "\n=== DONE ==="
```

---

## PowerShell Test Script

```powershell
# 1. Login
Write-Host "=== Logging in ===" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"username":"dgo_admin","password":"password123"}'

$TOKEN = $response.data.token
Write-Host "Token: $TOKEN`n" -ForegroundColor Green

# 2. Get applications
Write-Host "=== Getting Applications ===" -ForegroundColor Yellow
$apps = Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/applications" `
  -Headers @{"Authorization"="Bearer $TOKEN"}

$apps.data.applications | Select-Object applicationId, trackingId, status | Format-Table

# 3. Get documents
$APP_ID = "5a2646fa-324f-45dc-88b8-5097e03d3b85"
$TRACKING_ID = "REF-20260110-6106"

Write-Host "`n=== Getting Documents ===" -ForegroundColor Yellow
$docs = Invoke-RestMethod -Uri "http://localhost:5000/api/documents/tracking/${TRACKING_ID}?documentsOnly=true" `
  -Headers @{"Authorization"="Bearer $TOKEN"}

Write-Host "Found $($docs.data.Count) documents"
$docs.data | Select-Object documentId, documentType | Format-Table

# 4. Verify first document
if ($docs.data.Count -gt 0) {
    $DOC_ID = $docs.data[0].documentId
    Write-Host "`n=== Verifying Document: $DOC_ID ===" -ForegroundColor Yellow
    
    $verifyResult = Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/documents/$DOC_ID/verify" `
      -Method POST `
      -Headers @{"Authorization"="Bearer $TOKEN"; "Content-Type"="application/json"} `
      -Body '{"status":"APPROVED","remarks":"Verified by script"}'
    
    Write-Host "✓ Document verified" -ForegroundColor Green
}

# 5. Approve application
Write-Host "`n=== Approving Application ===" -ForegroundColor Yellow
$approveResult = Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/applications/$APP_ID/approve" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $TOKEN"; "Content-Type"="application/json"} `
  -Body '{"recommendation":"RECOMMENDED","remarks":"Approved by script"}'

Write-Host "✓ Application approved" -ForegroundColor Green
```

---

## Real Data to Use

**Application:**
- UUID: `5a2646fa-324f-45dc-88b8-5097e03d3b85`
- Tracking ID: `REF-20260110-6106`
- Application Number: `NOC/RAJ/2026/00001`
- Status: `INSPECTION_SCHEDULED`
- Documents: 7 total

**Document IDs:**
→ Get from Step 4 response - each document has unique `documentId`

---

## API Format Summary

### Individual Document Verification (NEW)
```
POST /api/officer/dgo/documents/:documentId/verify
Body: { "status": "APPROVED"|"REJECTED", "remarks": "..." }
```

### Bulk Document Verification (LEGACY)
```
POST /api/officer/dgo/applications/:appId/verify-documents
Body: { "documentsVerified": true, "verifiedDocuments": [...], ... }
```
