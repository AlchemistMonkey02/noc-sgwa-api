# Three-Way Document Verification - Complete Guide

## Overview

Documents are verified independently by three officers:
1. **DGO Officer** - District level
2. **SGWA Officer** - State level  
3. **Enforcement Wing** - Final verification

Each document has separate verification status for each officer.

---

## Real Documents from Application REF-20260110-6106

```json
[
    {"documentType": "AADHAR", "documentId": "doc_aadhar_1768047930902"},
    {"documentType": "PAN", "documentId": "doc_pan_1768047930902"},
    {"documentType": "LAND_OWNERSHIP", "documentId": "doc_land_1768047930902"},
    {"documentType": "SITE_PLAN", "documentId": "doc_site_1768047930902"},
    {"documentType": "UNDERTAKING", "documentId": "doc_undertaking_1768047930902"},
    {"documentType": "WATER_QUALITY_REPORT", "documentId": "doc_water_1768047930902"},
    {"documentType": "GST_CERTIFICATE", "documentId": "doc_gst_1768047930902"}
]
```

---

## API 1: Get Documents

```bash
curl -X GET "http://localhost:5000/api/documents/tracking/REF-20260110-6106?documentsOnly=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## API 2: DGO Verify Document

### Endpoint
```
POST /api/officer/dgo/applications/:trackingId/documents/:documentId/verify
```

### Example - Verify AADHAR
```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106/documents/doc_aadhar_1768047930902/verify" \
  -H "Authorization: Bearer DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Aadhar verified by DGO"}'
```

### Example - Verify All Documents (DGO)
```bash
# AADHAR
curl -X POST "http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106/documents/doc_aadhar_1768047930902/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Verified"}'

# PAN
curl -X POST "http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106/documents/doc_pan_1768047930902/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Verified"}'

# LAND_OWNERSHIP
curl -X POST "http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106/documents/doc_land_1768047930902/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Verified"}'

# SITE_PLAN
curl -X POST "http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106/documents/doc_site_1768047930902/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Verified"}'

# UNDERTAKING
curl -X POST "http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106/documents/doc_undertaking_1768047930902/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Verified"}'

# WATER_QUALITY_REPORT
curl -X POST "http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106/documents/doc_water_1768047930902/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Verified"}'

# GST_CERTIFICATE
curl -X POST "http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106/documents/doc_gst_1768047930902/verify" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Verified"}'
```

---

## API 3: SGWA Verify Document

### Endpoint
```
POST /api/officer/sgwa/applications/:trackingId/documents/:documentId/verify
```

### Example
```bash
curl -X POST "http://localhost:5000/api/officer/sgwa/applications/REF-20260110-6106/documents/doc_aadhar_1768047930902/verify" \
  -H "Authorization: Bearer SGWA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Aadhar verified by SGWA"}'
```

---

## API 4: Enforcement Verify Document

### Endpoint
```
POST /api/officer/enforcement/applications/:trackingId/documents/:documentId/verify
```

### Example
```bash
curl -X POST "http://localhost:5000/api/officer/enforcement/applications/REF-20260110-6106/documents/doc_aadhar_1768047930902/verify" \
  -H "Authorization: Bearer ENFORCEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Aadhar verified by Enforcement"}'
```

---

## Complete Workflow

```
1. DGO verifies all 7 documents
   → Each document: verification.dgo.status = "APPROVED"

2. SGWA verifies all 7 documents
   → Each document: verification.sgwa.status = "APPROVED"

3. Enforcement verifies all 7 documents
   → Each document: verification.enforcement.status = "APPROVED"

4. NOC can be issued (all documents verified by all three)
```

---

## Response Format

```json
{
  "success": true,
  "data": {
    "documentType": "AADHAR",
    "documentId": "doc_aadhar_1768047930902",
    "fileName": "mock_aadhar.pdf",
    "verification": {
      "dgo": {
        "verified": true,
        "status": "APPROVED",
        "verifiedBy": "dgo_officer_id",
        "verifiedAt": "2026-01-18T20:10:00Z",
        "remarks": "Verified by DGO"
      },
      "sgwa": {
        "verified": false,
        "status": "PENDING"
      },
      "enforcement": {
        "verified": false,
        "status": "PENDING"
      }
    }
  },
  "message": "Document approved by DGO"
}
```

---

## Officer Credentials

| Role | Username | Password |
|------|----------|----------|
| DGO | `dgo_admin` | `password123` |
| SGWA | `sgwa_admin` | `password123` |
| Enforcement | `enforcement_admin` | `password123` |

---

## Quick Test Script (Bash)

```bash
#!/bin/bash

# Login as DGO
DGO_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dgo_admin","password":"password123"}' \
  | jq -r '.data.token')

echo "DGO Token: $DGO_TOKEN"

# Verify all 7 documents as DGO
DOCS=("doc_aadhar_1768047930902" "doc_pan_1768047930902" "doc_land_1768047930902" "doc_site_1768047930902" "doc_undertaking_1768047930902" "doc_water_1768047930902" "doc_gst_1768047930902")

for DOC_ID in "${DOCS[@]}"; do
    echo "Verifying: $DOC_ID"
    curl -s -X POST "http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106/documents/$DOC_ID/verify" \
      -H "Authorization: Bearer $DGO_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status":"APPROVED","remarks":"Verified by DGO"}' | jq -r '.message'
done

echo "✓ All documents verified by DGO"
```
