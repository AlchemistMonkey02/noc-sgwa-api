# Document Verification - cURL Commands

## OPTION 1: Verify Single Document

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/verify-document" -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"documentId\":\"doc_aadhar_1768047930902\",\"status\":\"APPROVED\",\"remarks\":\"Verified\"}"
```

---

## OPTION 2: Verify All Documents at Once (Bulk)

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/verify-documents-bulk" -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"documentIds\":[\"doc_aadhar_1768047930902\",\"doc_pan_1768047930902\",\"doc_land_1768047930902\",\"doc_site_1768047930902\",\"doc_undertaking_1768047930902\",\"doc_water_1768047930902\",\"doc_gst_1768047930902\"],\"status\":\"APPROVED\",\"remarks\":\"All verified\"}"
```

---

## For SGWA Officer

### Single
```bash
curl -X POST "http://localhost:5000/api/officer/sgwa/verify-document" -H "Authorization: Bearer SGWA_TOKEN" -H "Content-Type: application/json" -d "{\"documentId\":\"doc_aadhar_1768047930902\",\"status\":\"APPROVED\",\"remarks\":\"Verified\"}"
```

### Bulk
```bash
curl -X POST "http://localhost:5000/api/officer/sgwa/verify-documents-bulk" -H "Authorization: Bearer SGWA_TOKEN" -H "Content-Type: application/json" -d "{\"documentIds\":[\"doc_aadhar_1768047930902\",\"doc_pan_1768047930902\",\"doc_land_1768047930902\",\"doc_site_1768047930902\",\"doc_undertaking_1768047930902\",\"doc_water_1768047930902\",\"doc_gst_1768047930902\"],\"status\":\"APPROVED\",\"remarks\":\"All verified\"}"
```

---

## For Enforcement Officer

### Single
```bash
curl -X POST "http://localhost:5000/api/officer/enforcement/verify-document" -H "Authorization: Bearer ENFORCEMENT_TOKEN" -H "Content-Type: application/json" -d "{\"documentId\":\"doc_aadhar_1768047930902\",\"status\":\"APPROVED\",\"remarks\":\"Verified\"}"
```

### Bulk
```bash
curl -X POST "http://localhost:5000/api/officer/enforcement/verify-documents-bulk" -H "Authorization: Bearer ENFORCEMENT_TOKEN" -H "Content-Type: application/json" -d "{\"documentIds\":[\"doc_aadhar_1768047930902\",\"doc_pan_1768047930902\",\"doc_land_1768047930902\",\"doc_site_1768047930902\",\"doc_undertaking_1768047930902\",\"doc_water_1768047930902\",\"doc_gst_1768047930902\"],\"status\":\"APPROVED\",\"remarks\":\"All verified\"}"
```

---

## Get Token First

```bash
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"dgo_admin\",\"password\":\"password123\"}"
```
