# DGO Actions - cURL Commands

Replace `YOUR_TOKEN` with your actual DGO token.

---

## 1. APPROVE APPLICATION

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/approve" -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"recommendation\":\"RECOMMENDED\",\"technicalReview\":\"Application meets all technical requirements\",\"conditions\":[\"Install digital flow meter within 30 days\",\"Submit quarterly compliance reports\"],\"remarks\":\"All documents verified. Recommend approval.\"}"
```

---

## 2. REJECT APPLICATION

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/reject" -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"reason\":\"TECHNICAL_NON_COMPLIANCE\",\"remarks\":\"Proposed extraction exceeds sustainable yield\",\"details\":\"Area is over-exploited as per CGWA guidelines\"}"
```

---

## 3. RAISE QUERY

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/query" -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"subject\":\"Clarification\",\"query\":\"Please provide details\",\"category\":\"TECHNICAL\"}" breakdown of water consumption\",\"category\":\"TECHNICAL\",\"deadline\":\"2026-02-15\"}"
```

---

## 4. FORWARD TO SGWA

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/applications/5a2646fa-324f-45dc-88b8-5097e03d3b85/forward" -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"recommendation\":\"RECOMMENDED\",\"remarks\":\"Forwarding to SGWA for final review\"}"
```

---

## BONUS: Verify Document

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/verify-document" -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"documentId\":\"doc_aadhar_1768047930902\",\"status\":\"APPROVED\",\"remarks\":\"Verified\"}"
```

---

## Quick Test (Get Token First)

```bash
# Get token
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"dgo_admin\",\"password\":\"password123\"}"

# Then use token in commands above
```
