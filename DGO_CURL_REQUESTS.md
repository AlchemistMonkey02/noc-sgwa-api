# DGO Officer API - cURL Requests

**Base URL**: `http://localhost:3000/api`

## 1. Login (Get Token)
Run this first to get your Authentication Token.
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dgo.officer@rajasthan.gov.in",
    "password": "password123",
    "role": "DGO"
  }'
```
*Copy the `token` from the response for subsequent requests.*

## 2. Dashboard Stats
```bash
curl -X GET http://localhost:3000/api/officer/dgo/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 3. List Pending Applications
```bash
curl -X GET "http://localhost:3000/api/officer/dgo/applications?status=PENDING_DGO_REVIEW&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 4. Get Application Details
Replace `:id` with the actual Application ID (e.g., `NOC-2026-001` or MongoDB `_id`).
```bash
curl -X GET http://localhost:3000/api/officer/dgo/applications/:id \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 5. View Document
Replace `:docId` with the `documentId`.
```bash
curl -X GET http://localhost:3000/api/officer/common/documents/:docId/view \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 6. Schedule Inspection
```bash
curl -X POST http://localhost:3000/api/officer/dgo/applications/:id/schedule-inspection \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectionDate": "2026-02-15T10:00:00Z"
  }'
```

## 7. Submit Inspection Report
```bash
curl -X POST http://localhost:3000/api/officer/dgo/applications/:id/inspection-report \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "findings": "Site Verified. Coordinates match. Land usage is consistent.",
    "coordinates": { "lat": 26.9124, "lng": 75.7873 },
    "recommendation": "APPROVE"
  }'
```

## 8. Forward to SGWA (Approve)
```bash
curl -X POST http://localhost:3000/api/officer/dgo/applications/:id/forward \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation": "RECOMMEND_APPROVAL",
    "remarks": "Recommended for approval based on satisfactory site inspection."
  }'
```

## 9. Reject Application
```bash
curl -X POST http://localhost:3000/api/officer/dgo/applications/:id/reject \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "Rejected due to mismatch in land ownership documents."
  }'
```

## 10. Raise Query
```bash
curl -X POST http://localhost:3000/api/officer/dgo/applications/:id/query \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Document Clarification",
    "query": "Please upload the latest Revenue Record (Jamabandi).",
    "responseDeadline": "2026-02-28T00:00:00Z"
  }'
```
