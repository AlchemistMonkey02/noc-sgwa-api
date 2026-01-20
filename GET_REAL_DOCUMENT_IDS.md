# Get Real Document IDs and Verify - Complete Example

## Step 1: Get Documents with Real IDs

```bash
curl -X GET "http://localhost:5000/api/documents/tracking/REF-20260110-6106?documentsOnly=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response will show:**
```json
{
  "success": true,
  "data": [
    {
      "documentId": "abc123-real-doc-id-1",
      "documentType": "LAND_OWNERSHIP_PROOF",
      "originalFilename": "land_deed.pdf"
    },
    {
      "documentId": "xyz789-real-doc-id-2",
      "documentType": "PROJECT_PROPOSAL",
      "originalFilename": "proposal.pdf"
    }
  ]
}
```

---

## Step 2: Use REAL Document IDs to Verify

**Replace `abc123-real-doc-id-1` with actual documentId from Step 1:**

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/documents/abc123-real-doc-id-1/verify" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Land ownership verified"}'
```

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/documents/xyz789-real-doc-id-2/verify" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Project proposal verified"}'
```

---

## Automated Script to Get & Verify All Documents

### Bash Script
```bash
#!/bin/bash

# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dgo_admin","password":"password123"}' \
  | jq -r '.data.token')

echo "Logged in. Token: $TOKEN"

# 2. Get documents
TRACKING_ID="REF-20260110-6106"
echo -e "\nGetting documents for $TRACKING_ID..."

DOCS=$(curl -s -X GET "http://localhost:5000/api/documents/tracking/$TRACKING_ID?documentsOnly=true" \
  -H "Authorization: Bearer $TOKEN")

# 3. Display all document IDs
echo -e "\nDocuments found:"
echo "$DOCS" | jq -r '.data[] | "\(.documentType): \(.documentId)"'

# 4. Verify each document
echo -e "\nVerifying documents..."
DOC_IDS=$(echo "$DOCS" | jq -r '.data[].documentId')

for DOC_ID in $DOC_IDS; do
    echo "Verifying: $DOC_ID"
    
    curl -s -X POST "http://localhost:5000/api/officer/dgo/documents/$DOC_ID/verify" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status":"APPROVED","remarks":"Auto-verified by script"}' | jq -r '.message'
done

echo -e "\n✓ All documents verified!"
```

### PowerShell Script
```powershell
# 1. Login
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"username":"dgo_admin","password":"password123"}'

$TOKEN = $response.data.token
Write-Host "Logged in. Token: $TOKEN`n"

# 2. Get documents
$TRACKING_ID = "REF-20260110-6106"
Write-Host "Getting documents for $TRACKING_ID..."

$docs = Invoke-RestMethod -Uri "http://localhost:5000/api/documents/tracking/${TRACKING_ID}?documentsOnly=true" `
  -Headers @{"Authorization"="Bearer $TOKEN"}

# 3. Display document IDs
Write-Host "`nDocuments found:"
foreach ($doc in $docs.data) {
    Write-Host "  $($doc.documentType): $($doc.documentId)"
}

# 4. Verify each document
Write-Host "`nVerifying documents..."
foreach ($doc in $docs.data) {
    $verifyBody = @{
        status = "APPROVED"
        remarks = "Verified by PowerShell script"
    } | ConvertTo-Json
    
    Write-Host "Verifying: $($doc.documentId)"
    
    $result = Invoke-RestMethod -Uri "http://localhost:5000/api/officer/dgo/documents/$($doc.documentId)/verify" `
      -Method POST `
      -Headers @{"Authorization"="Bearer $TOKEN"; "Content-Type"="application/json"} `
      -Body $verifyBody
    
    Write-Host "  ✓ $($result.message)"
}

Write-Host "`n✓ All documents verified!" -ForegroundColor Green
```

---

## Manual Steps with Real IDs

### Step A: Get Document IDs
```bash
curl -X GET "http://localhost:5000/api/documents/tracking/REF-20260110-6106?documentsOnly=true" \
  -H "Authorization: Bearer TOKEN" | jq '.data[].documentId'
```

**Copy each document ID from output**

### Step B: Verify Document 1
```bash
# Replace DOC_ID_FROM_STEP_A with actual ID
curl -X POST "http://localhost:5000/api/officer/dgo/documents/DOC_ID_FROM_STEP_A/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Verified"}'
```

### Step C: Verify Document 2
```bash
# Replace with second document ID
curl -X POST "http://localhost:5000/api/officer/dgo/documents/DOC_ID_2_FROM_STEP_A/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Verified"}'
```

---

## Example with Hypothetical Real IDs

If your document IDs are like: `67890abc-def1-2345-6789-0abcdef12345`

```bash
# Verify document 1
curl -X POST "http://localhost:5000/api/officer/dgo/documents/67890abc-def1-2345-6789-0abcdef12345/verify" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Land deed verified"}'

# Verify document 2
curl -X POST "http://localhost:5000/api/officer/dgo/documents/12345xyz-abcd-6789-efgh-ijklmnop1234/verify" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Proposal verified"}'
```

---

## The documentId Field

The `documentId` in the URL path comes from the `documentId` field in the document object, NOT the MongoDB `_id`.

**Example document object:**
```json
{
  "_id": "69623e4985ba8d751b6e026b",          ← MongoDB ID (don't use)
  "documentId": "uuid-abc-123-xyz",           ← Use THIS in URL
  "documentType": "LAND_OWNERSHIP_PROOF",
  "originalFilename": "land_deed.pdf"
}
```

**So the command becomes:**
```bash
curl -X POST "http://localhost:5000/api/officer/dgo/documents/uuid-abc-123-xyz/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Verified"}'
```
