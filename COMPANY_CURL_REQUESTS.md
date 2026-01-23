# Company API cURL Requests

Use these standard cURL commands to test the Company APIs. These are equivalent to the PowerShell examples in `COMPANY_API_GUIDE.md`.

**Prerequisites:**
1. Replace `{{TOKEN}}` with your JWT token.
2. Replace `{{BASE_URL}}` with `http://localhost:3000`.

## User Endpoints

### 1. Register Company (Multipart/Form-Data)
> Note: The `data` field must contain the JSON object as a string.
```bash
curl -X POST "{{BASE_URL}}/api/companies/register" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -F "data={\"companyName\": \"ABC Industries Pvt Ltd\", \"companyType\": \"PRIVATE_LIMITED\", \"industryType\": \"MANUFACTURING\", \"incorporationId\": \"U12345RJ2023PTC123456\", \"gstNumber\": \"07AAKCS1234F1Z5\", \"panNumber\": \"AAKCS1234F\", \"email\": \"info@abcindustries.com\", \"phone\": \"9876543210\", \"registeredAddress\": {\"addressLine1\": \"Plot No. 123\", \"state\": \"Rajasthan\", \"district\": \"Jaipur\", \"pincode\": \"302013\", \"city\": \"Jaipur\"}, \"authorizedPerson\": {\"name\": \"Rajesh Kumar\", \"designation\": \"Managing Director\", \"email\": \"rajesh@example.com\", \"phone\": \"9876543210\"}}" \
  -F "companyPan=@/path/to/pan.pdf" \
  -F "gstCertificate=@/path/to/gst.pdf" \
  -F "incorporationCertificate=@/path/to/incorp.pdf" \
  -F "authorizationLetter=@/path/to/auth.pdf"
```

### 1a. Register Company (JSON only / No Documents)
```bash
curl -X POST "{{BASE_URL}}/api/companies/register" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "ABC Industries Pvt Ltd",
    "companyType": "PRIVATE_LIMITED",
    "industryType": "MANUFACTURING",
    "incorporationId": "U12345RJ2023PTC123456",
    "gstNumber": "07AAKCS1234F1Z5",
    "panNumber": "AAKCS1234F",
    "email": "info@abcindustries.com",
    "phone": "9876543210",
    "registeredAddress": {
        "addressLine1": "Plot No. 123",
        "state": "Rajasthan",
        "district": "Jaipur",
        "pincode": "302013",
        "city": "Jaipur"
    },
    "authorizedPerson": {
        "name": "Rajesh Kumar",
        "designation": "Managing Director",
        "email": "rajesh@example.com",
        "phone": "9876543210"
    }
  }'
```

### 2. Get Company Profile (Current User)
```bash
curl -X GET "{{BASE_URL}}/api/companies/profile" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### 2. Get All User Companies
```bash
curl -X GET "{{BASE_URL}}/api/companies?verificationStatus=PENDING" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### 3. Get Company Statistics
```bash
curl -X GET "{{BASE_URL}}/api/companies/stats" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### 4. Get Company Details
```bash
curl -X GET "{{BASE_URL}}/api/companies/{{COMPANY_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}"
```

### 5. Update Company
```bash
curl -X PUT "{{BASE_URL}}/api/companies/{{COMPANY_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@abcindustries.com",
    "phone": "9876543299",
    "numberOfEmployees": 200
  }'
```

### 6. Delete Company
```bash
curl -X DELETE "{{BASE_URL}}/api/companies/{{COMPANY_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}"
```

---

## Officer Endpoints

### 7. Get All Companies (Officer View)
```bash
curl -X GET "{{BASE_URL}}/api/companies/officer/all?verificationStatus=PENDING&page=1&limit=20" \
  -H "Authorization: Bearer {{OFFICER_TOKEN}}"
```

### 8. Verify/Reject Company
```bash
curl -X PUT "{{BASE_URL}}/api/companies/officer/{{COMPANY_ID}}/verify" \
  -H "Authorization: Bearer {{OFFICER_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve"
  }'
```
