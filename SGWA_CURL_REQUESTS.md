# SGWA Officer Portal - cURL Requests

Base URL: `http://localhost:5000/api`

## 1. Authentication

### Login (Get Token)
```bash
curl -X POST "http://localhost:5000/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\": \"sgwa_admin\", \"password\": \"password123\"}"
```
> **Note:** Copy the `token` from the response and replace `<TOKEN>` in subsequent requests.

---

## 2. Dashboard & Metrics

### Get Dashboard Overview
```bash
curl -X GET "http://localhost:5000/api/officer/sgwa/dashboard" ^
  -H "Authorization: Bearer <TOKEN>"
```

### Get Performance Metrics
```bash
curl -X GET "http://localhost:5000/api/officer/sgwa/metrics?period=monthly" ^
  -H "Authorization: Bearer <TOKEN>"
```

---

## 3. Application Management

### List Pending SGWA Applications
```bash
curl -X GET "http://localhost:5000/api/officer/sgwa/applications?status=PENDING_SGWA_REVIEW" ^
  -H "Authorization: Bearer <TOKEN>"
```

### Get Application Details
```bash
curl -X GET "http://localhost:5000/api/officer/sgwa/applications/<APPLICATION_ID>" ^
  -H "Authorization: Bearer <TOKEN>"
```

### View Documents for Application
```bash
curl -X GET "http://localhost:5000/api/applications/noc/ref/<TRACKING_ID>/documents" ^
  -H "Authorization: Bearer <TOKEN>"
```

---

## 4. Approval Workflow

### Approve Application (Issue NOC)
```bash
curl -X POST "http://localhost:5000/api/officer/sgwa/applications/<APPLICATION_ID>/approve" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"nocValidityYears\": 3, \"waterAllocationLimit\": 150, \"conditions\": [\"Install flow meter\", \"Submit annual report\"], \"remarks\": \"Approved based on DGO recommendation\"}"
```

### Reject Application
```bash
curl -X POST "http://localhost:5000/api/officer/sgwa/applications/<APPLICATION_ID>/reject" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"rejectionReasons\": [\"Incomplete Data\", \"Over-exploited Zone\"], \"remarks\": \"Cannot approve in critical zone without CGWA clearance\"}"
```

### Assign Application (Internal)
```bash
curl -X POST "http://localhost:5000/api/officer/sgwa/applications/<APPLICATION_ID>/assign" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"officerId\": \"<TARGET_OFFICER_ID>\", \"remarks\": \"Please review technical details\"}"
```

### Add Internal Note
```bash
curl -X POST "http://localhost:5000/api/officer/sgwa/applications/<APPLICATION_ID>/notes" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"noteText\": \"Discussed with DGO regarding site proximity to forest area.\", \"visibility\": \"INTERNAL_ONLY\"}"
```

---

## 5. Query Management

### Get All Queries
```bash
curl -X GET "http://localhost:5000/api/officer/sgwa/queries?status=OPEN" ^
  -H "Authorization: Bearer <TOKEN>"
```

### Raise New Query
```bash
curl -X POST "http://localhost:5000/api/officer/sgwa/applications/<APPLICATION_ID>/query" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"subject\": \"Clarification on Water Usage\", \"query\": \"Please explain the high water requirement for domestic purpose.\", \"priority\": \"HIGH\"}"
```

### View Specific Query
```bash
curl -X GET "http://localhost:5000/api/officer/sgwa/queries/<QUERY_ID>" ^
  -H "Authorization: Bearer <TOKEN>"
```

### Accept Query Response
```bash
curl -X POST "http://localhost:5000/api/officer/sgwa/queries/<QUERY_ID>/accept" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"remarks\": \"Explanation accepted.\", \"moveToStatus\": \"UNDER_REVIEW\"}"
```

### Reject Query Response
```bash
curl -X POST "http://localhost:5000/api/officer/sgwa/queries/<QUERY_ID>/reject" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"newQueryText\": \"Explanation is still insufficient. Please provide calculations.\", \"raiseNewQuery\": true}"
```

---

## 6. Reports & Notifications

### Generate Report
```bash
curl -X POST "http://localhost:5000/api/officer/sgwa/reports/generate" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"reportType\": \"APPLICATION_SUMMARY\", \"filters\": {\"dateFrom\": \"2026-01-01\", \"dateTo\": \"2026-01-31\"}}"
```

### Get Notifications
```bash
curl -X GET "http://localhost:5000/api/officer/sgwa/notifications" ^
  -H "Authorization: Bearer <TOKEN>"
```

### Mark Notification as Read
```bash
curl -X PUT "http://localhost:5000/api/officer/sgwa/notifications/<NOTIFICATION_ID>/read" ^
  -H "Authorization: Bearer <TOKEN>"
```
