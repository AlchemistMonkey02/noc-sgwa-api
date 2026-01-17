# Inspection Officer API - cURL Requests

Base URL: `http://localhost:5000/api`

## 1. Authentication
*Note: Use a DGO or dedicated Inspection Officer credential.*

### Login (Get Token)
```bash
curl -X POST "http://localhost:5000/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\": \"dgo_admin\", \"password\": \"password123\"}"
```
> **Note:** Copy the `token` from the response and replace `<TOKEN>` in subsequent requests.

---

## 2. Dashboard & Assignments

### Get Inspection Dashboard
```bash
curl -X GET "http://localhost:5000/api/officer/inspection/dashboard" ^
  -H "Authorization: Bearer <TOKEN>"
```

### Get Assigned Inspections (My Inspections)
```bash
curl -X GET "http://localhost:5000/api/officer/inspection/my-inspections?status=SCHEDULED" ^
  -H "Authorization: Bearer <TOKEN>"
```

---

## 3. Inspection Management

### Get Inspection Details
```bash
curl -X GET "http://localhost:5000/api/officer/inspection/<INSPECTION_ID>/details" ^
  -H "Authorization: Bearer <TOKEN>"
```
*Replace `<INSPECTION_ID>` with an ID from the "My Inspections" list.*

### Start Inspection (Check-In)
```bash
curl -X POST "http://localhost:5000/api/officer/inspection/<INSPECTION_ID>/start" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"latitude\": 26.9124, \"longitude\": 75.7873, \"timestamp\": \"2026-01-20T10:00:00Z\"}"
```

### Upload Site Photo
```bash
curl -X POST "http://localhost:5000/api/officer/inspection/<INSPECTION_ID>/upload-photo" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: multipart/form-data" ^
  -F "file=@/path/to/site_photo.jpg" ^
  -F "description=Borewell Location" ^
  -F "tag=BOREWELL"
```

---

## 4. Reporting

### Save Draft Report
```bash
curl -X POST "http://localhost:5000/api/officer/inspection/<INSPECTION_ID>/save-draft" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"locationMatch\": true, \"existingSources\": 2, \"remarks\": \"Draft: Verified sources so far.\"}"
```

### Submit Final Report
```bash
curl -X POST "http://localhost:5000/api/officer/inspection/<INSPECTION_ID>/submit" ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"locationMatch\": true, \"landUseMatch\": true, \"existingSources\": 2, \"meterInstalled\": true, \"rainwaterHarvesting\": \"implemented\", \"plantationStatus\": \"started\", \"remarks\": \"Site compliant. 2 Borewells active.\", \"recommendation\": \"RECOMMENDED\", \"geoLocation\": {\"lat\": 26.9124, \"lng\": 75.7873, \"accuracy\": 10}, \"photos\": []}"
```

---

## 5. History

### Get Inspection History
```bash
curl -X GET "http://localhost:5000/api/officer/inspection/history" ^
  -H "Authorization: Bearer <TOKEN>"
```
