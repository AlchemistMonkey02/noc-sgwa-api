# SGWA API Testing Guide

**Base URL:** `http://localhost:3000`

**Total Endpoints:** 40

---

## 🔐 Authentication Endpoints (8)

### 1. Register User
**POST** `/api/auth/register`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "password": "password123",
    "confirmPassword": "password123",
    "organizationName": "Test Company",
    "organizationType": "COMPANY"
  }'
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "john.doe@example.com",
      "firstName": "John",
      "userType": "APPLICANT"
    }
  },
  "message": "Registration successful!"
}
```

---

### 2. Login
**POST** `/api/auth/login`

**PowerShell:**
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "username": "john.doe@example.com",
    "password": "password123"
  }' `
  -SessionVariable session

# Extract token
$result = $response.Content | ConvertFrom-Json
$token = $result.data.token
Write-Host "Token: $token"
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "expiresIn": 3600
  }
}
```

---

### 3. Get Profile
**GET** `/api/auth/profile` 🔒 Protected

**PowerShell:**
```powershell
$token = "YOUR_JWT_TOKEN_HERE"
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/profile" `
  -Method GET `
  -Headers @{
    "Authorization"="Bearer $token"
    "Content-Type"="application/json"
  }
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Update Profile
**PUT** `/api/auth/profile` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/profile" `
  -Method PUT `
  -Headers @{
    "Authorization"="Bearer $token"
    "Content-Type"="application/json"
  } `
  -Body '{
    "firstName": "Jane",
    "address": {
      "city": "Jaipur",
      "state": "Rajasthan",
      "pincode": "302001"
    }
  }'
```

---

### 5. Logout
**POST** `/api/auth/logout` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/logout" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"}
```

---

### 6. Refresh Token
**POST** `/api/auth/refresh` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/refresh" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $refreshToken"}
```

---

### 7. Forgot Password
**POST** `/api/auth/forgot-password`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/forgot-password" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email": "john.doe@example.com"}'
```

---

### 8. Reset Password
**POST** `/api/auth/reset-password`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/reset-password" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "token": "RESET_TOKEN_FROM_EMAIL",
    "password": "newpassword123",
    "confirmPassword": "newpassword123"
  }'
```

---

## 📍 Master Data Endpoints (7)

### 1. Get States
**GET** `/api/master/states`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/master/states"
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "stateId": "RAJ",
      "stateName": "Rajasthan",
      "stateCode": "RJ"
    }
  ]
}
```

---

### 2. Get Districts
**GET** `/api/master/districts?stateId=RAJ`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/master/districts?stateId=RAJ"
```

**Response:**
```json
{
  "success": true,
  "count": 33,
  "data": [
    {
      "districtId": "JAIPUR",
      "districtName": "Jaipur",
      "districtCode": "JP",
      "stateId": "RAJ"
    }
  ]
}
```

---

### 3. Get Blocks
**GET** `/api/master/blocks?districtId=JAIPUR`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/master/blocks?districtId=JAIPUR"
```

---

### 4. Get Block Category
**GET** `/api/master/blocks/:districtId/:blockId/category`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/master/blocks/JAIPUR/JAIPUR_BLOCK1/category"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "blockId": "JAIPUR_BLOCK1",
    "blockName": "Jaipur Block 1",
    "category": "SAFE",
    "requiresNOC": false,
    "categoryCriteria": {
      "dynamicGroundWaterResource": 10000,
      "annualGroundWaterExtraction": 5000,
      "stageOfExtraction": 50
    }
  }
}
```

---

### 5. Get Industry Types
**GET** `/api/master/industry-types`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/master/industry-types"
```

---

### 6. Get Document Requirements
**GET** `/api/master/documents/requirements?applicationType=NEW_NOC`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/master/documents/requirements?applicationType=NEW_NOC"
```

**Response:**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "documentId": "LAND_OWNERSHIP",
      "documentName": "Land Ownership Proof",
      "isMandatory": true,
      "maxFileSize": 5,
      "allowedFormats": ["pdf", "jpg", "png"]
    }
  ]
}
```

---

### 7. Get Fee Structure
**GET** `/api/master/fees?applicationType=NEW_NOC&blockCategory=SAFE`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/master/fees?applicationType=NEW_NOC&blockCategory=SAFE&waterRequirement=10"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feeId": "FEE_NEW_SAFE",
    "applicationType": "NEW_NOC",
    "blockCategory": "SAFE",
    "baseAmount": 5000,
    "ecChargesPerMLD": 1000,
    "ecCharges": 10000,
    "totalEstimated": 16000
  }
}
```

---

## 📄 Document Management (6)

### 1. Upload Documents
**POST** `/api/documents/upload` 🔒 Protected

**PowerShell:**
```powershell
$token = "YOUR_JWT_TOKEN"
$filePath = "C:\path\to\document.pdf"

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$ContentType = "multipart/form-data; boundary=$boundary"

Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"} `
  -ContentType $ContentType `
  -InFile $filePath
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "AADHAR=@/path/to/aadhar.pdf" \
  -F "PAN=@/path/to/pan.pdf"
```

---

### 2. List Documents
**GET** `/api/documents` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/documents" `
  -Headers @{"Authorization"="Bearer $token"}
```

---

### 3. Download Document
**GET** `/api/documents/:id/download` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/documents/DOCUMENT_ID/download" `
  -Headers @{"Authorization"="Bearer $token"} `
  -OutFile "downloaded_document.pdf"
```

---

### 4. View Document
**GET** `/api/documents/:id/view` 🔒 Protected

**PowerShell:**
```powershell
Start-Process "http://localhost:3000/api/documents/DOCUMENT_ID/view?token=$token"
```

---

### 5. Delete Document
**DELETE** `/api/documents/:id` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/documents/DOCUMENT_ID" `
  -Method DELETE `
  -Headers @{"Authorization"="Bearer $token"}
```

---

### 6. Verify Document (Officer)
**PUT** `/api/documents/:id/verify` 🔒 Officer Only

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/documents/DOCUMENT_ID/verify" `
  -Method PUT `
  -Headers @{
    "Authorization"="Bearer $officerToken"
    "Content-Type"="application/json"
  } `
  -Body '{
    "isVerified": true
  }'
```

---

## 📋 NOC Applications - User (9)

### 1. Create NOC Application
**POST** `/api/applications/noc` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc" `
  -Method POST `
  -Headers @{
    "Authorization"="Bearer $token"
    "Content-Type"="application/json"
  } `
  -Body '{
    "applicationType": "NEW",
    "location": {
      "stateId": "RAJ",
      "districtId": "JAIPUR",
      "blockId": "JAIPUR_BLOCK1",
      "village": "Sanganer",
      "address": "123 Industrial Area",
      "pincode": "302001"
    },
    "projectDetails": {
      "projectName": "Manufacturing Unit Alpha",
      "industryType": "TEXTILE",
      "projectDescription": "Textile manufacturing facility",
      "landArea": 5000,
      "builtUpArea": 3000
    },
    "waterRequirement": {
      "purpose": "Industrial Manufacturing",
      "dailyRequirement": 10,
      "sourceType": "BOREWELL",
      "numberOfBorewells": 2,
      "depth": 150,
      "pumpCapacity": 10
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "uuid",
    "status": "DRAFT",
    "location": {...},
    "projectDetails": {...}
  }
}
```

---

### 2. List Applications
**GET** `/api/applications/noc?status=DRAFT&page=1&limit=10` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc?status=DRAFT" `
  -Headers @{"Authorization"="Bearer $token"}
```

---

### 3. Get Application Details
**GET** `/api/applications/noc/:id` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/APPLICATION_ID" `
  -Headers @{"Authorization"="Bearer $token"}
```

---

### 4. Update Application
**PUT** `/api/applications/noc/:id` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/APPLICATION_ID" `
  -Method PUT `
  -Headers @{
    "Authorization"="Bearer $token"
    "Content-Type"="application/json"
  } `
  -Body '{
    "projectDetails": {
      "projectName": "Updated Project Name"
    }
  }'
```

---

### 5. Submit Application
**POST** `/api/applications/noc/:id/submit` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/APPLICATION_ID/submit" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "uuid",
    "applicationNumber": "NOC/RAJ/2024/00001",
    "status": "SUBMITTED",
    "feeDetails": {
      "baseAmount": 5000,
      "ecCharges": 10000,
      "totalAmount": 16000
    }
  }
}
```

---

### 6. Withdraw Application
**POST** `/api/applications/noc/:id/withdraw` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/APPLICATION_ID/withdraw" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"}
```

---

### 7. Get Queries
**GET** `/api/applications/noc/:id/queries` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/APPLICATION_ID/queries" `
  -Headers @{"Authorization"="Bearer $token"}
```

---

### 8. Respond to Query
**POST** `/api/applications/noc/:id/queries/:queryId/respond` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/APP_ID/queries/QUERY_ID/respond" `
  -Method POST `
  -Headers @{
    "Authorization"="Bearer $token"
    "Content-Type"="application/json"
  } `
  -Body '{
    "response": "We have uploaded the required land ownership documents as requested."
  }'
```

---

### 9. Get Certificate
**GET** `/api/applications/noc/:id/certificate` 🔒 Protected

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/APPLICATION_ID/certificate" `
  -Headers @{"Authorization"="Bearer $token"} `
  -OutFile "noc_certificate.pdf"
```

---

## 👮 Officer Portal (5)

### 1. Get Applications for Review
**GET** `/api/officer/applications?assignedOnly=false&status=SUBMITTED` 🔒 Officer Only

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/officer/applications?assignedOnly=false" `
  -Headers @{"Authorization"="Bearer $officerToken"}
```

---

### 2. Assign Application
**POST** `/api/officer/applications/:id/assign` 🔒 Officer Only

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/officer/applications/APP_ID/assign" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $officerToken"}
```

---

### 3. Raise Query
**POST** `/api/officer/applications/:id/query` 🔒 Officer Only

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/officer/applications/APP_ID/query" `
  -Method POST `
  -Headers @{
    "Authorization"="Bearer $officerToken"
    "Content-Type"="application/json"
  } `
  -Body '{
    "query": "Please provide updated land ownership documents with current date."
  }'
```

---

### 4. Approve Application
**POST** `/api/officer/applications/:id/approve` 🔒 Officer Only

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/officer/applications/APP_ID/approve" `
  -Method POST `
  -Headers @{
    "Authorization"="Bearer $officerToken"
    "Content-Type"="application/json"
  } `
  -Body '{
    "approvedWaterQuantity": 10,
    "validityYears": 3,
    "conditions": [
      "Monthly water usage reporting required",
      "Annual inspection mandatory"
    ],
    "restrictions": [
      "Water extraction limited to approved quantity"
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {...},
    "certificate": {
      "nocNumber": "NOC/CERT/2024/00001",
      "validFrom": "2024-01-06",
      "validUpto": "2027-01-06"
    }
  }
}
```

---

### 5. Reject Application
**POST** `/api/officer/applications/:id/reject` 🔒 Officer Only

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/officer/applications/APP_ID/reject" `
  -Method POST `
  -Headers @{
    "Authorization"="Bearer $officerToken"
    "Content-Type"="application/json"
  } `
  -Body '{
    "rejectionReason": "Incomplete documentation provided. Missing land ownership proof."
  }'
```

---

## 🧮 Calculator Tools (4)

### 1. EC Calculator
**POST** `/api/tools/ec-calculator`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/tools/ec-calculator" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "waterRequirement": 10,
    "blockCategory": "SAFE",
    "industryType": "MANUFACTURING"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "waterRequirement": 10,
    "blockCategory": "SAFE",
    "industryType": "MANUFACTURING",
    "baseRate": 1000,
    "multiplier": 1.2,
    "ecCharges": 12000,
    "calculation": "10 MLD × ₹1000/MLD × 1.2 = ₹12000"
  }
}
```

---

### 2. Abstraction Charges
**POST** `/api/tools/abstraction-charges`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/tools/abstraction-charges" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "annualExtraction": 100,
    "blockCategory": "SEMI_CRITICAL",
    "purpose": "INDUSTRIAL"
  }'
```

---

### 3. Water Budget Calculator
**POST** `/api/tools/water-budget`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/tools/water-budget" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "dynamicResource": 10000,
    "proposedExtraction": 500,
    "existingExtraction": 4000
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dynamicGroundWaterResource": 10000,
    "existingExtraction": 4000,
    "proposedExtraction": 500,
    "totalExtraction": 4500,
    "availableResource": 6000,
    "stageOfExtraction": 45,
    "category": "SAFE",
    "nocRequired": true,
    "validityYears": 5,
    "recommendedAction": "NOC can be granted with standard conditions"
  }
}
```

---

### 4. Fee Calculator
**POST** `/api/tools/fee-calculator`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/tools/fee-calculator" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "applicationType": "NEW",
    "blockCategory": "SAFE",
    "waterRequirement": 10,
    "industryType": "MANUFACTURING"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "breakdown": {
      "baseAmount": 5000,
      "ecCharges": 12000,
      "processingFee": 500,
      "waterBudgetCharges": 500,
      "inspectionFee": 1000
    },
    "totalAmount": 19000
  }
}
```

---

## 🌐 Public Endpoints (1)

### Public Application Tracking
**GET** `/api/public/track/:applicationNumber`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/public/track/NOC/RAJ/2024/00001"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationNumber": "NOC/RAJ/2024/00001",
    "applicationType": "NEW",
    "status": "UNDER_REVIEW",
    "submittedAt": "2024-01-06T10:00:00Z"
  }
}
```

---

## 📝 Testing Workflow Example

### Complete Flow: Register → Create App → Submit → Approve

```powershell
# 1. Register User
$regResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{...}'

# 2. Login
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{...}'
$token = ($loginResponse.Content | ConvertFrom-Json).data.token

# 3. Create Application
$appResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc" -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body '{...}'
$appId = ($appResponse.Content | ConvertFrom-Json).data.applicationId

# 4. Submit Application
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/$appId/submit" -Method POST -Headers @{"Authorization"="Bearer $token"}

# 5. Officer Approve (need officer token)
Invoke-WebRequest -Uri "http://localhost:3000/api/officer/applications/$appId/approve" -Method POST -Headers @{"Authorization"="Bearer $officerToken"; "Content-Type"="application/json"} -Body '{...}'
```

---

## 🔧 Troubleshooting

### Common Errors

**401 Unauthorized**
- Token expired or invalid
- Solution: Login again to get new token

**400 Validation Error**
- Missing required fields
- Solution: Check request body matches schema

**404 Not Found**
- Resource doesn't exist
- Solution: Verify IDs and routes

**403 Forbidden**
- Insufficient permissions
- Solution: Use correct user type (Officer for officer endpoints)

---

## ✅ Quick Test Checklist

- [ ] Register user successfully
- [ ] Login and receive token
- [ ] Get master data (states, districts, blocks)
- [ ] Calculate fees using calculator
- [ ] Create NOC application (draft)
- [ ] Submit application
- [ ] Track application (public endpoint)
- [ ] Officer: Assign application
- [ ] Officer: Approve/Reject application
- [ ] Get NOC certificate

---

**Server:** `http://localhost:3000`  
**Postman Collection:** Import this guide as examples  
**Testing Tool:** Postman, Insomnia, or PowerShell

Happy Testing! 🚀
