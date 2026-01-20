# DGO Application Actions - API Reference

Use Application ID: `5a2646fa-324f-45dc-88b8-5097e03d3b85`

---

## 1. APPROVE APPLICATION (Forward to SGWA)

**Endpoint:** `POST /api/officer/dgo/applications/:id/approve`

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/approve" \
  -H "Authorization: Bearer DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation": "RECOMMENDED",
    "technicalReview": "Application meets all technical requirements",
    "conditions": [
      "Install digital flow meter within 30 days",
      "Submit quarterly compliance reports"
    ],
    "remarks": "All documents verified. Recommend approval."
  }'
```

---

## 2. REJECT APPLICATION

**Endpoint:** `POST /api/officer/dgo/applications/:id/reject`

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/reject" \
  -H "Authorization: Bearer DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "TECHNICAL_NON_COMPLIANCE",
    "remarks": "Proposed extraction exceeds sustainable yield",
    "details": "Area is over-exploited as per CGWA guidelines"
  }'
```

---

## 3. RAISE QUERY

**Endpoint:** `POST /api/officer/dgo/applications/:id/query`

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/query" \
  -H "Authorization: Bearer DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Water Requirement Clarification",
    "query": "Please provide detailed monthly breakdown of water consumption",
    "category": "TECHNICAL",
    "deadline": "2026-02-15"
  }'
```

---

## 4. FORWARD TO SGWA (Same as Approve)

**Endpoint:** `POST /api/officer/dgo/applications/:id/forward`

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/forward" \
  -H "Authorization: Bearer DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation": "RECOMMENDED",
    "remarks": "Forwarding to SGWA for final review"
  }'
```

---

## Complete Workflow Example

```bash
# 1. Login as DGO
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dgo_admin","password":"password123"}' \
  | jq -r '.data.token')

echo "DGO Token: $TOKEN"

# 2. Get application details
curl -s -X GET "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85" \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Verify all documents (see SIMPLE_DOCUMENT_VERIFICATION.md)

# 4. Approve and forward to SGWA
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation": "RECOMMENDED",
    "remarks": "All documents verified. Application approved."
  }'
```

---

## All DGO Action APIs

| Action | Endpoint | Method |
|--------|----------|--------|
| **Approve** | `/api/officer/dgo/applications/:id/approve` | POST |
| **Reject** | `/api/officer/dgo/applications/:id/reject` | POST |
| **Raise Query** | `/api/officer/dgo/applications/:id/query` | POST |
| **Forward to SGWA** | `/api/officer/dgo/applications/:id/forward` | POST |
| **Verify Document** | `/api/officer/dgo/verify-document` | POST |

---

## Request Bodies

### Approve
```json
{
  "recommendation": "RECOMMENDED",
  "technicalReview": "Meets all requirements",
  "conditions": ["Install flow meter", "Submit reports"],
  "remarks": "Approved"
}
```

### Reject
```json
{
  "reason": "TECHNICAL_NON_COMPLIANCE",
  "remarks": "Does not meet requirements",
  "details": "Specific reason for rejection"
}
```

### Query
```json
{
  "subject": "Query Subject",
  "query": "Your question here",
  "category": "TECHNICAL",
  "deadline": "2026-02-15"
}
```

### Forward to SGWA
```json
{
  "recommendation": "RECOMMENDED",
  "remarks": "Forwarding to SGWA"
}
```
