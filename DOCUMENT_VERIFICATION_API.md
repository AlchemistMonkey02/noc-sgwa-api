# Document Verification APIs - Three-Way Approval

## Overview
Documents are now verified by three different officer roles independently:
1. **DGO Officer** - District level verification
2. **SGWA Officer** - State level verification
3. **Enforcement Wing** - Final verification before NOC issuance

Each officer verifies documents individually by document ID.

---

## API 1: Get Documents by Tracking ID

### Endpoint
```
GET /api/documents/tracking/:trackingId
```

### Description
Retrieve all documents uploaded for an application using its tracking ID.

### cURL Example
```bash
curl -X GET http://localhost:5000/api/documents/tracking/TRACK123456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response
```json
{
  "success": true,
  "data": {
    "application": {
      "applicationId": "app_uuid_123",
      "applicationNumber": "RJ/CGWA/NOC/2026/001234",
      "trackingId": "TRACK123456",
      "status": "PENDING_DGO_REVIEW"
    },
    "documents": [
      {
        "documentId": "doc_uuid_1",
        "documentType": "LAND_OWNERSHIP_PROOF",
        "originalFilename": "land_deed.pdf",
        "fileSize": 2048576,
        "uploadedAt": "2026-01-15T08:00:00Z",
        "verification": {
          "dgo": {
            "status": "PENDING",
            "verified": false
          },
          "sgwa": {
            "status": "PENDING",
            "verified": false
          },
          "enforcement": {
            "status": "PENDING",
            "verified": false
          }
        }
      }
    ]
  }
}
```

---

## API 2: Get Documents by Application ID

### Endpoint
```
GET /api/documents/application/:applicationId
```

### Description
Retrieve all documents for an application using application ID.

### cURL Example
```bash
curl -X GET http://localhost:5000/api/documents/application/app_uuid_123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## API 3: Verify Document (DGO Officer)

### Endpoint
```
POST /api/officer/dgo/documents/:documentId/verify
```

### Description
DGO officer verifies individual document.

### cURL Example - Approve
```bash
curl -X POST http://localhost:5000/api/officer/dgo/documents/doc_uuid_1/verify \
  -H "Authorization: Bearer YOUR_DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "remarks": "Document verified and matches application details"
  }'
```

### cURL Example - Reject
```bash
curl -X POST http://localhost:5000/api/officer/dgo/documents/doc_uuid_1/verify \
  -H "Authorization: Bearer YOUR_DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "remarks": "Document is unclear, please reupload higher quality scan"
  }'
```

### Response
```json
{
  "success": true,
  "data": {
    "documentId": "doc_uuid_1",
    "documentType": "LAND_OWNERSHIP_PROOF",
    "verification": {
      "dgo": {
        "verified": true,
        "status": "APPROVED",
        "verifiedBy": "dgo_officer_id",
        "verifiedAt": "2026-01-18T10:00:00Z",
        "remarks": "Document verified and matches application details"
      },
      "sgwa": {
        "status": "PENDING",
        "verified": false
      },
      "enforcement": {
        "status": "PENDING",
        "verified": false
      }
    }
  },
  "message": "Document verified successfully"
}
```

---

## API 4: Verify Document (SGWA Officer)

### Endpoint
```
POST /api/officer/sgwa/documents/:documentId/verify
```

### cURL Example
```bash
curl -X POST http://localhost:5000/api/officer/sgwa/documents/doc_uuid_1/verify \
  -H "Authorization: Bearer YOUR_SGWA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "remarks": "Technical review complete, document approved"
  }'
```

---

## API 5: Verify Document (Enforcement Wing)

### Endpoint
```
POST /api/officer/enforcement/documents/:documentId/verify
```

### cURL Example
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/documents/doc_uuid_1/verify \
  -H "Authorization: Bearer YOUR_ENFORCEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "remarks": "Final verification complete"
  }'
```

---

## Complete Verification Flow

```
1. User uploads documents
         ↓
2. DGO verifies each document
   POST /api/officer/dgo/documents/:documentId/verify
         ↓
3. SGWA verifies each document
   POST /api/officer/sgwa/documents/:documentId/verify
         ↓
4. Enforcement verifies each document
   POST /api/officer/enforcement/documents/:documentId/verify
         ↓
5. NOC issued (all documents verified by all three)
```

---

## Document Verification Status

Each document has three independent verification statuses:

| Officer | Status | Meaning |
|---------|--------|---------|
| DGO | PENDING | Not yet verified by DGO |
| DGO | APPROVED | DGO approved this document |
| DGO | REJECTED | DGO rejected, needs reupload |
| SGWA | PENDING | Not yet verified by SGWA |
| SGWA | APPROVED | SGWA approved this document |
| SGWA | REJECTED | SGWA rejected, needs reupload |
| Enforcement | PENDING | Not yet verified by Enforcement |
| Enforcement | APPROVED | Enforcement approved |
| Enforcement | REJECTED | Enforcement rejected |

---

## Example: Verify Multiple Documents

```bash
# Get all documents by tracking ID
curl -X GET http://localhost:5000/api/documents/tracking/TRACK123456 \
  -H "Authorization: Bearer $DGO_TOKEN"

# Response shows all document IDs
# doc_uuid_1, doc_uuid_2, doc_uuid_3

# DGO verifies each document
curl -X POST http://localhost:5000/api/officer/dgo/documents/doc_uuid_1/verify \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Verified"}'

curl -X POST http://localhost:5000/api/officer/dgo/documents/doc_uuid_2/verify \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Verified"}'

curl -X POST http://localhost:5000/api/officer/dgo/documents/doc_uuid_3/verify \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"REJECTED","remarks":"Document unclear"}'
```

---

## Endpoints Summary

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/documents/tracking/:trackingId` | All | Get documents by tracking ID |
| GET | `/api/documents/application/:applicationId` | All | Get documents by app ID |
| POST | `/api/officer/dgo/documents/:documentId/verify` | DGO | DGO verifies document |
| POST | `/api/officer/sgwa/documents/:documentId/verify` | SGWA | SGWA verifies document |
| POST | `/api/officer/enforcement/documents/:documentId/verify` | Enforcement | Enforcement verifies document |
