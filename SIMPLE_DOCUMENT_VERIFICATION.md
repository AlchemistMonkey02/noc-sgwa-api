# Simple Document Verification API

## Overview
- Pass `documentId` in request BODY (not URL)
- Each officer (DGO, SGWA, Enforcement) verifies independently
- Document is fully verified when all three approve

---

## API 1: Get All Documents

```bash
curl -X GET "http://localhost:5000/api/documents/tracking/REF-20260110-6106?documentsOnly=true" \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "documentType": "AADHAR",
      "documentId": "doc_aadhar_1768047930902",
      "fileName": "mock_aadhar.pdf",
      "isVerified": false,
      "_id": "6962453a4bea0c45992f1c12"
    }
  ]
}
```

---

## API 2: DGO Verify Document

**Endpoint:** `POST /api/officer/dgo/verify-document`

**Body:** `documentId` is in the request body

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/verify-document" \
  -H "Authorization: Bearer DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_aadhar_1768047930902",
    "status": "APPROVED",
    "remarks": "Aadhar verified by DGO"
  }'
```

---

## API 3: SGWA Verify Document

**Endpoint:** `POST /api/officer/sgwa/verify-document`

```bash
curl -X POST "http://localhost:5000/api/officer/sgwa/verify-document" \
  -H "Authorization: Bearer SGWA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_aadhar_1768047930902",
    "status": "APPROVED",
    "remarks": "Aadhar verified by SGWA"
  }'
```

---

## API 4: Enforcement Verify Document

**Endpoint:** `POST /api/officer/enforcement/verify-document`

```bash
curl -X POST "http://localhost:5000/api/officer/enforcement/verify-document" \
  -H "Authorization: Bearer ENFORCEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_aadhar_1768047930902",
    "status": "APPROVED",
    "remarks": "Aadhar verified by Enforcement"
  }'
```

---

## Verify All 7 Documents (DGO Example)

```bash
# Login as DGO
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dgo_admin","password":"password123"}'

# Copy token, then verify each document:

# Document 1: AADHAR
curl -X POST "http://localhost:5000/api/officer/dgo/verify-document" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc_aadhar_1768047930902","status":"APPROVED","remarks":"Verified"}'

# Document 2: PAN
curl -X POST "http://localhost:5000/api/officer/dgo/verify-document" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc_pan_1768047930902","status":"APPROVED","remarks":"Verified"}'

# Document 3: LAND_OWNERSHIP
curl -X POST "http://localhost:5000/api/officer/dgo/verify-document" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc_land_1768047930902","status":"APPROVED","remarks":"Verified"}'

# Document 4: SITE_PLAN
curl -X POST "http://localhost:5000/api/officer/dgo/verify-document" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc_site_1768047930902","status":"APPROVED","remarks":"Verified"}'

# Document 5: UNDERTAKING
curl -X POST "http://localhost:5000/api/officer/dgo/verify-document" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc_undertaking_1768047930902","status":"APPROVED","remarks":"Verified"}'

# Document 6: WATER_QUALITY_REPORT
curl -X POST "http://localhost:5000/api/officer/dgo/verify-document" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc_water_1768047930902","status":"APPROVED","remarks":"Verified"}'

# Document 7: GST_CERTIFICATE
curl -X POST "http://localhost:5000/api/officer/dgo/verify-document" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc_gst_1768047930902","status":"APPROVED","remarks":"Verified"}'
```

---

## All Document IDs

1. `doc_aadhar_1768047930902`
2. `doc_pan_1768047930902`
3. `doc_land_1768047930902`
4. `doc_site_1768047930902`
5. `doc_undertaking_1768047930902`
6. `doc_water_1768047930902`
7. `doc_gst_1768047930902`

---

##  API Endpoints Summary

| Officer | Endpoint | Method |
|---------|----------|--------|
| DGO | `/api/officer/dgo/verify-document` | POST |
| SGWA | `/api/officer/sgwa/verify-document` | POST |
| Enforcement | `/api/officer/enforcement/verify-document` | POST |

**Request Body:**
```json
{
  "documentId": "doc_aadhar_1768047930902",
  "status": "APPROVED",
  "remarks": "Document verified"
}
```
