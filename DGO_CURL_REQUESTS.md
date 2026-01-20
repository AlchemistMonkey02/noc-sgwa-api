# DGO Portal API - cURL Requests

## 1. Authentication
### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "dgo_admin", "password": "password123"}'
```
*Save the `token` from response for subsequent requests.*

## 2. Dashboard
### Get Dashboard Stats
```bash
curl -X GET "http://localhost:3000/api/officer/dgo/dashboard" \
  -H "Authorization: Bearer <TOKEN>"
```

### Expected Response
```json
{
    "success": true,
    "data": {
        "stats": {
            "totalApplications": 12,
            "pendingVerification": 3,
            "underReview": 5,
            "queriesRaised": 2,
            "inspectionPending": 2
        },
        "myDistrict": "Assigned District",
        "recentApplications": []
    }
}
```

## 3. Application Management
### List Applications
```bash
curl -X GET "http://localhost:3000/api/officer/dgo/applications?status=SUBMITTED&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```

### Get Application Details
```bash
curl -X GET "http://localhost:3000/api/officer/dgo/applications/<APPLICATION_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

### Verify Documents
```bash
curl -X POST "http://localhost:3000/api/officer/dgo/applications/<APPLICATION_ID_OR_TRACKING_ID>/verify-documents" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
        { "documentId": "doc_123", "status": "ACCEPTED", "remarks": "Verified" }
    ]
  }'
```

### Verify Documents (by Tracking ID) - Windows
```bash
curl -X POST "http://localhost:3000/api/officer/dgo/applications/REF-20260110-6106/verify-documents" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{
    \"documents\": [
        { \"documentId\": \"doc_123\", \"status\": \"ACCEPTED\", \"remarks\": \"Verified\" }
    ]
  }"
```

## 4. Workflow Actions
### Schedule Inspection
```bash
curl -X POST "http://localhost:3000/api/officer/dgo/applications/<APPLICATION_ID_OR_TRACKING_ID>/schedule-inspection" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectionDate": "2026-03-01",
    "officerId": "<OFFICER_ID>"
  }'
```

### Schedule Inspection (Windows)
```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/REF-20260110-6106/schedule-inspection" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{ \"inspectionDate\": \"2026-03-01\", \"officerId\": \"696e146cce932f4fde5190a1\" }"
```
*Note: Uses verified Inspector ID `696e146cce932f4fde5190a1`*

### Raise Query
```bash
curl -X POST "http://localhost:3000/api/officer/dgo/applications/<APPLICATION_ID_OR_TRACKING_ID>/query" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "queryTitle": "Clarification on Land Use",
    "description": "Please provide more details on land use.",
    "responseDeadline": "2026-03-10"
  }'
```

### Raise Query (Tracking ID) - Windows
```bash
curl -X POST "http://localhost:3000/api/officer/dgo/applications/REF-20260110-6106/query" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{ \"queryTitle\": \"Correction Needed\", \"description\": \"Please upload clear map\", \"responseDeadline\": \"2026-03-15\" }"
```

### Forward to SGWA (Approve)
```bash
curl -X POST "http://localhost:3000/api/officer/dgo/applications/<APPLICATION_ID_OR_TRACKING_ID>/forward" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation": "RECOMMEND_APPROVAL",
    "remarks": "All documents verified and inspection passed."
  }'
```

### Forward (Approve) using Tracking ID (Windows)
```bash
curl -X POST "http://localhost:3000/api/officer/dgo/applications/REF-20260110-6106/forward" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{ \"recommendation\": \"RECOMMEND_APPROVAL\", \"remarks\": \"Approved via Tracking ID\" }"
```

## 5. Reports
### Get Compliance Report
```bash
curl -X GET "http://localhost:3000/api/officer/dgo/compliance-report" \
  -H "Authorization: Bearer <TOKEN>"
```
### Get Inspection Report (DGO View)
DGO views the report submitted by the inspector.

```bash
curl -X GET "http://localhost:5000/api/officer/dgo/inspections/APP_1768808640319_5/report" \
  -H "Authorization: Bearer <DGO_TOKEN>"
```
*Note: Using REAL Application ID `APP_1768808640319_5` (Status: INSPECTION_SCHEDULED)*
