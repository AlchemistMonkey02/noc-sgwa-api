# Updated Test Commands - Use Application UUID Instead

The tracking ID exists but the DGO API might be filtering by district. Use the **applicationId (UUID)** instead:

---

## 1. LOGIN

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dgo_admin","password":"password123"}'
```

**→ Copy token!**

---

## 2. GET APPLICATION DETAILS (Use UUID)

```bash
curl -X GET "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85" \
  -H "Authorization: Bearer TOKEN"
```

---

## 3. GET ALL APPLICATIONS (List all first)

```bash
curl -X GET "http://localhost:5000/api/officer/dgo/applications" \
  -H "Authorization: Bearer TOKEN"
```

---

## 4. GET DOCUMENTS (Use Tracking ID)

```bash
curl -X GET "http://localhost:5000/api/documents/tracking/REF-20260110-6106?documentsOnly=true" \
  -H "Authorization: Bearer TOKEN"
```

---

## 5. VERIFY DOCUMENTS

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/verify-documents" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentsVerified": true,
    "remarks": "All documents verified",
    "verifiedDocuments": ["LAND_OWNERSHIP_PROOF", "PROJECT_PROPOSAL"],
    "missingDocuments": []
  }'
```

---

## 6. APPROVE APPLICATION

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/approve" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation": "RECOMMENDED",
    "remarks": "Approved"
  }'
```

---

## All Available Applications

From database query:

1. `4ff71411-76a4-4c54-840e-8eef76d81c3a` - REF-20260110-3653 (DRAFT)
2. `5a2646fa-324f-45dc-88b8-5097e03d3b85` - REF-20260110-6106 (INSPECTION_SCHEDULED) ✅
3. `255ed4b3-c410-4ff7-8a31-a874eed984dd` - REF-20260111-2452 (DRAFT)
4. `f55db90c-455a-40f8-8e10-c74ab5d71f56` - REF-20260111-1645 (DRAFT)
5. `28a1b292-9f22-42cd-ab6f-c971d670dde6` - REF-20260111-6878 (NOC_ISSUED)

**Use application #2 for testing!**
