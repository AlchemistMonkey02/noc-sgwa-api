# DGO Officer - Individual cURL Commands

Copy and paste these commands one at a time. Replace tokens and IDs as needed.

---

## 1. LOGIN

```bash
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"dgo_admin\",\"password\":\"password123\"}"
```

**→ Copy the token from response!**

---

## 2. GET DASHBOARD

```bash
curl -X GET http://localhost:5000/api/officer/dgo/dashboard -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 3. GET STATS (Alternative)

```bash
curl -X GET http://localhost:5000/api/officer/dgo/stats -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 4. GET ALL APPLICATIONS

```bash
curl -X GET http://localhost:5000/api/officer/dgo/applications -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**→ Copy an applicationId from response!**

---

## 5. GET ALL APPLICATIONS (With Filters)

```bash
curl -X GET "http://localhost:5000/api/officer/dgo/applications?status=PENDING_DGO_REVIEW&page=1&limit=10" -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 6. GET APPLICATION DETAILS

```bash
curl -X GET http://localhost:5000/api/officer/dgo/applications/APP_ID_HERE -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 7. VERIFY DOCUMENTS

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID_HERE/verify-documents -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"documentsVerified\":true,\"remarks\":\"All documents verified successfully\",\"verifiedDocuments\":[\"LAND_OWNERSHIP_PROOF\",\"PROJECT_PROPOSAL\",\"ENVIRONMENTAL_CLEARANCE\"],\"missingDocuments\":[]}"
```

---

## 8. VERIFY DOCUMENTS (With Missing Docs)

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID_HERE/verify-documents -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"documentsVerified\":false,\"remarks\":\"Some documents missing\",\"verifiedDocuments\":[\"LAND_OWNERSHIP_PROOF\"],\"missingDocuments\":[\"ENVIRONMENTAL_CLEARANCE\",\"WATER_AUDIT_REPORT\"]}"
```

---

## 9. SCHEDULE INSPECTION

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID_HERE/schedule-inspection -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"inspectorId\":\"INSPECTOR_001\",\"inspectionDate\":\"2026-02-01\",\"purpose\":\"Site verification and borewell inspection\",\"checkpoints\":[\"Verify proposed borewell location\",\"Check land ownership documents\",\"Verify existing water sources\"]}"
```

---

## 10. GET INSPECTION REPORT

```bash
curl -X GET http://localhost:5000/api/officer/dgo/inspections/APP_ID_HERE/report -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 11. RAISE QUERY

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID_HERE/query -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"subject\":\"Clarification on Water Requirement\",\"question\":\"Please provide detailed breakdown of industrial water consumption per process\",\"category\":\"TECHNICAL\",\"documents\":[\"WATER_AUDIT_REPORT\"],\"deadline\":\"2026-02-15\"}"
```

---

## 12. GET ALL QUERIES

```bash
curl -X GET http://localhost:5000/api/officer/dgo/queries -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**→ Copy a queryId from response!**

---

## 13. GET ALL QUERIES (With Filters)

```bash
curl -X GET "http://localhost:5000/api/officer/dgo/queries?status=PENDING&page=1" -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 14. GET QUERY DETAILS

```bash
curl -X GET http://localhost:5000/api/officer/dgo/queries/QUERY_ID_HERE -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 15. ACCEPT QUERY RESPONSE

```bash
curl -X POST http://localhost:5000/api/officer/dgo/queries/QUERY_ID_HERE/accept -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"remarks\":\"Response satisfactory. All requested documents provided.\"}"
```

---

## 16. REJECT QUERY RESPONSE

```bash
curl -X POST http://localhost:5000/api/officer/dgo/queries/QUERY_ID_HERE/reject -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"reason\":\"Incomplete information\",\"remarks\":\"Water audit report missing monthly breakdown\"}"
```

---

## 17. APPROVE APPLICATION

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID_HERE/approve -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"recommendation\":\"RECOMMENDED\",\"technicalReview\":\"Application meets all technical requirements. Proposed extraction within sustainable limits.\",\"conditions\":[\"Install digital flow meter with telemetry within 30 days\",\"Implement rainwater harvesting system\",\"Submit quarterly compliance reports\"],\"remarks\":\"Documents verified. Inspection report positive. Recommend approval.\"}"
```

---

## 18. FORWARD TO SGWA (Same as Approve)

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID_HERE/forward -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"recommendation\":\"RECOMMENDED\",\"remarks\":\"Forwarding to SGWA for review\"}"
```

---

## 19. REJECT APPLICATION

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID_HERE/reject -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"reason\":\"TECHNICAL_NON_COMPLIANCE\",\"remarks\":\"Proposed extraction exceeds sustainable yield. Area is Over-Exploited.\",\"details\":\"Cannot issue NOC in over-exploited areas as per CGWA guidelines.\"}"
```

---

## 20. GET COMPLIANCE REPORT

```bash
curl -X GET "http://localhost:5000/api/officer/dgo/compliance-report?fromDate=2026-01-01&toDate=2026-01-31" -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 21. GENERATE REPORT

```bash
curl -X POST http://localhost:5000/api/officer/dgo/reports/generate -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"reportType\":\"MONTHLY_SUMMARY\",\"month\":\"2026-01\",\"format\":\"PDF\"}"
```

---

## 22. GET DOCUMENTS BY TRACKING ID

```bash
curl -X GET http://localhost:5000/api/documents/tracking/TRACK123456 -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 23. GET DOCUMENTS BY APPLICATION ID

```bash
curl -X GET http://localhost:5000/api/documents/application/APP_ID_HERE -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 24. VERIFY DOCUMENT (Approve)

```bash
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOCUMENT_ID_HERE/verify -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"status\":\"APPROVED\",\"remarks\":\"Document verified successfully\"}"
```

---

## 25. VERIFY DOCUMENT (Reject)

```bash
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOCUMENT_ID_HERE/verify -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"status\":\"REJECTED\",\"remarks\":\"Document is unclear, please reupload\"}"
```

---

## SUMMARY OF ALL ENDPOINTS

| # | Endpoint | Method |
|---|----------|--------|
| 1 | `/api/auth/login` | POST |
| 2 | `/api/officer/dgo/dashboard` | GET |
| 3 | `/api/officer/dgo/stats` | GET |
| 4 | `/api/officer/dgo/applications` | GET |
| 5 | `/api/officer/dgo/applications` (filtered) | GET |
| 6 | `/api/officer/dgo/applications/:id` | GET |
| 7 | `/api/officer/dgo/applications/:id/verify-documents` | POST |
| 8 | `/api/officer/dgo/applications/:id/verify-documents` (reject) | POST |
| 9 | `/api/officer/dgo/applications/:id/schedule-inspection` | POST |
| 10 | `/api/officer/dgo/inspections/:id/report` | GET |
| 11 | `/api/officer/dgo/applications/:id/query` | POST |
| 12 | `/api/officer/dgo/queries` | GET |
| 13 | `/api/officer/dgo/queries` (filtered) | GET |
| 14 | `/api/officer/dgo/queries/:id` | GET |
| 15 | `/api/officer/dgo/queries/:id/accept` | POST |
| 16 | `/api/officer/dgo/queries/:id/reject` | POST |
| 17 | `/api/officer/dgo/applications/:id/approve` | POST |
| 18 | `/api/officer/dgo/applications/:id/forward` | POST |
| 19 | `/api/officer/dgo/applications/:id/reject` | POST |
| 20 | `/api/officer/dgo/compliance-report` | GET |
| 21 | `/api/officer/dgo/reports/generate` | POST |
| 22 | `/api/documents/tracking/:trackingId` | GET |
| 23 | `/api/documents/application/:applicationId` | GET |
| 24 | `/api/officer/dgo/documents/:documentId/verify` (approve) | POST |
| 25 | `/api/officer/dgo/documents/:documentId/verify` (reject) | POST |

**Total: 25 cURL commands for DGO Officer APIs**
