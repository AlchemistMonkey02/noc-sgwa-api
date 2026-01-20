# Document Verification - Both Options

## Option 1: Verify One Document at a Time

**Endpoint:** `POST /api/officer/dgo/verify-document`

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/verify-document" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_aadhar_1768047930902",
    "status": "APPROVED",
    "remarks": "Verified"
  }'
```

---

## Option 2: Verify All Documents at Once (Bulk)

**Endpoint:** `POST /api/officer/dgo/verify-documents-bulk`

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/verify-documents-bulk" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentIds": [
      "doc_aadhar_1768047930902",
      "doc_pan_1768047930902",
      "doc_land_1768047930902",
      "doc_site_1768047930902",
      "doc_undertaking_1768047930902",
      "doc_water_1768047930902",
      "doc_gst_1768047930902"
    ],
    "status": "APPROVED",
    "remarks": "All documents verified"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDocuments": 7,
    "successCount": 7,
    "failedCount": 0,
    "results": [
      {
        "documentId": "doc_aadhar_1768047930902",
        "documentType": "AADHAR",
        "success": true,
        "status": "APPROVED"
      },
      ...
    ]
  },
  "message": "Verified 7 of 7 documents"
}
```

---

## All Document IDs (for bulk request)

```json
{
  "documentIds": [
    "doc_aadhar_1768047930902",
    "doc_pan_1768047930902",
    "doc_land_1768047930902",
    "doc_site_1768047930902",
    "doc_undertaking_1768047930902",
    "doc_water_1768047930902",
    "doc_gst_1768047930902"
  ],
  "status": "APPROVED",
  "remarks": "All verified"
}
```

---

## API Summary

| Method | Endpoint | Use Case |
|--------|----------|----------|
| **Single** | `/api/officer/dgo/verify-document` | Verify one document |
| **Bulk** | `/api/officer/dgo/verify-documents-bulk` | Verify all documents at once |

**Same for SGWA and Enforcement:**
- `/api/officer/sgwa/verify-document`
- `/api/officer/sgwa/verify-documents-bulk`
- `/api/officer/enforcement/verify-document`
- `/api/officer/enforcement/verify-documents-bulk`
