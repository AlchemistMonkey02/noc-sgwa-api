# DGO Officer - cURL Commands (Copy One by One)

Replace YOUR_TOKEN, APP_ID, TRACKING_ID, DOC_ID as you get them from responses.

---

## 1. LOGIN

```bash
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"dgo_admin\",\"password\":\"password123\"}"
```

→ Copy the **token** from response!

---

## 2. DASHBOARD

```bash
curl -X GET http://localhost:5000/api/officer/dgo/dashboard -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 3. GET APPLICATIONS

```bash
curl -X GET http://localhost:5000/api/officer/dgo/applications -H "Authorization: Bearer YOUR_TOKEN"
```

→ Copy **applicationId** and **trackingId** from response!

---

## 4. GET APPLICATION DETAILS

```bash
curl -X GET http://localhost:5000/api/officer/dgo/applications/APP_ID -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 5. GET DOCUMENTS (ONLY DOCUMENTS, NO APP DATA)

```bash
curl -X GET "http://localhost:5000/api/documents/tracking/TRACKING_ID?documentsOnly=true" -H "Authorization: Bearer YOUR_TOKEN"
```

→ Copy all **documentId** values from response!

---

## 6a. VERIFY DOCUMENT 1 - APPROVE

```bash
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOC_ID_1/verify -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"APPROVED\",\"remarks\":\"Document verified\"}"
```

---

## 6b. VERIFY DOCUMENT 2 - APPROVE

```bash
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOC_ID_2/verify -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"APPROVED\",\"remarks\":\"Document verified\"}"
```

---

## 6c. VERIFY DOCUMENT 3 - APPROVE

```bash
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOC_ID_3/verify -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"APPROVED\",\"remarks\":\"Document verified\"}"
```

---

## 6d. VERIFY DOCUMENT 4 - APPROVE

```bash
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOC_ID_4/verify -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"APPROVED\",\"remarks\":\"Document verified\"}"
```

---

## 6e. VERIFY DOCUMENT 5 - APPROVE

```bash
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOC_ID_5/verify -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"APPROVED\",\"remarks\":\"Document verified\"}"
```

---

## 6f. VERIFY DOCUMENT 6 - APPROVE

```bash
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOC_ID_6/verify -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"APPROVED\",\"remarks\":\"Document verified\"}"
```

---

## 6g. VERIFY DOCUMENT 7 - APPROVE

```bash
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOC_ID_7/verify -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"APPROVED\",\"remarks\":\"Document verified\"}"
```

---

## 6x. IF NEED TO REJECT A DOCUMENT

```bash
curl -X POST http://localhost:5000/api/officer/dgo/documents/DOC_ID_X/verify -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"status\":\"REJECTED\",\"remarks\":\"Document unclear, reupload needed\"}"
```

---

## 7. SCHEDULE INSPECTION (OPTIONAL)

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/schedule-inspection -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"inspectorId\":\"INSPECTOR_001\",\"inspectionDate\":\"2026-02-01\",\"purpose\":\"Site verification\"}"
```

---

## 8. VIEW INSPECTION REPORT (OPTIONAL)

```bash
curl -X GET http://localhost:5000/api/officer/dgo/inspections/APP_ID/report -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 9. RAISE QUERY (OPTIONAL)

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/query -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"subject\":\"Water Requirement Clarification\",\"question\":\"Please provide breakdown\",\"category\":\"TECHNICAL\",\"deadline\":\"2026-02-15\"}"
```

---

## 10. APPROVE APPLICATION (FINAL STEP)

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/approve -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"recommendation\":\"RECOMMENDED\",\"remarks\":\"All documents verified. Recommend approval.\"}"
```

---

## ALTERNATIVE: REJECT APPLICATION

```bash
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP_ID/reject -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"reason\":\"TECHNICAL_NON_COMPLIANCE\",\"remarks\":\"Area is over-exploited\"}"
```

---

## QUICK REFERENCE

| Step | What to Copy |
|------|--------------|
| 1 | token |
| 3 | applicationId, trackingId |
| 5 | all documentId values |
| Then | verify each document |
| Finally | approve or reject application |
