# Quick Test - Get Documents API

Run this command (replace TOKEN with your actual token from login):

```bash
curl -X GET "http://localhost:5000/api/documents/tracking/REF-20260110-6106?documentsOnly=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (7 documents):**
```json
{
  "success": true,
  "data": [
    {
      "documentType": "AADHAR",
      "documentId": "doc_aadhar_1768047930902",
      "fileName": "mock_aadhar.pdf",
      "isVerified": true,
      "_id": "6962453a4bea0c45992f1c12",
      "remarks": "Verified Correct"
    },
    {
      "documentType": "PAN",
      "documentId": "doc_pan_1768047930902",
      "fileName": "mock_pan.pdf",
      "isVerified": true
    },
    ... 5 more documents
  ]
}
```

## Document IDs Ready to Use:

1. `doc_aadhar_1768047930902` - AADHAR
2. `doc_pan_1768047930902` - PAN
3. `doc_land_1768047930902` - LAND_OWNERSHIP
4. `doc_site_1768047930902` - SITE_PLAN
5. `doc_undertaking_1768047930902` - UNDERTAKING
6. `doc_water_1768047930902` - WATER_QUALITY_REPORT
7. `doc_gst_1768047930902` - GST_CERTIFICATE

## Verify Individual Document Example:

```bash
curl -X POST "http://localhost:5000/api/officer/dgo/documents/doc_aadhar_1768047930902/verify" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Aadhar verified"}'
```
