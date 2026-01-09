# Company Registration API - Complete Guide

## Overview
Users can register and manage companies under their profile. Each user can have multiple companies, track their verification status, and manage company details.

---

## User Endpoints

### 1. Register Company
**POST** `/api/companies/register`

Register a new company.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "companyName": "ABC Industries Pvt Ltd",
  "companyType": "PRIVATE_LIMITED",
  "industryType": "MANUFACTURING",
  "companyRegistrationNumber": "U12345RJ2020PTC123456",
  "cinNumber": "U12345RJ2020PTC123456",
  "gstNumber": "07AAKCS1234F1Z5",
  "panNumber": "AAKCS1234F",
  "tanNumber": "DELS12345E",
  "email": "info@abc industries.com",
  "phone": "9876543210",
  "alternatePhone": "9876543211",
  "website": "https://www.abcindustries.com",
  "registeredAddress": {
    "addressLine1": "Plot No. 123, Industrial Area",
    "addressLine2": "Sector 5",
    "addressLine3": "RIICO",
    "state": "Rajasthan",
    "district": "Jaipur",
    "city": "Jaipur",
    "pincode": "302013"
  },
  "sameAsRegistered": false,
  "communicationAddress": {
    "addressLine1": "456 MG Road",
    "state": "Rajasthan",
    "district": "Jaipur",
    "city": "Jaipur",
    "pincode": "302001"
  },
  "authorizedPerson": {
    "name": "Rajesh Kumar",
    "designation": "Managing Director",
    "email": "rajesh@abcindustries.com",
    "phone": "9876543212",
    "aadhaarNumber": "123456789012"
  },
  "numberOfEmployees": 150,
  "annualTurnover": 50000000,
  "dateOfIncorporation": "2020-05-15",
  "remarks": "Established manufacturing unit"
}
```

**PowerShell:**
```powershell
$token = "YOUR_JWT_TOKEN"
$body = @{
    companyName = "ABC Industries Pvt Ltd"
    companyType = "PRIVATE_LIMITED"
    industryType = "MANUFACTURING"
    gstNumber = "07AAKCS1234F1Z5"
    panNumber = "AAKCS1234F"
    email = "info@abcindustries.com"
    phone = "9876543210"
    registeredAddress = @{
        addressLine1 = "Plot No. 123"
        state = "Rajasthan"
        district = "Jaipur"
        pincode = "302013"
    }
    authorizedPerson = @{
        name = "Rajesh Kumar"
        designation = "Managing Director"
    }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:3000/api/companies/register" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $body
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "695cfd1234abcdef12345678",
    "userId": "695cfa2dbf74fe74ab7d1ae9",
    "companyName": "ABC Industries Pvt Ltd",
    "companyType": "PRIVATE_LIMITED",
    "gstNumber": "07AAKCS1234F1Z5",
    "verificationStatus": "PENDING",
    "status": "ACTIVE",
    "createdAt": "2026-01-06T12:00:00.000Z"
  },
  "message": "Company registered successfully! Verification pending."
}
```

---

### 2. Get All User Companies
**GET** `/api/companies`

Get all companies registered by the logged-in user.

**Query Parameters:**
- `status` (optional): ACTIVE | INACTIVE | SUSPENDED
- `verificationStatus` (optional): PENDING | VERIFIED | REJECTED

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/companies?verificationStatus=PENDING" `
  -Headers @{"Authorization"="Bearer $token"}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "_id": "695cfd1234abcdef12345678",
        "companyName": "ABC Industries Pvt Ltd",
        "companyType": "PRIVATE_LIMITED",
        "gstNumber": "07AAKCS1234F1Z5",
        "verificationStatus": "PENDING",
        "status": "ACTIVE",
        "createdAt": "2026-01-06T12:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

### 3. Get Company Statistics
**GET** `/api/companies/stats`

Get company registration statistics for the user.

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/companies/stats" `
  -Headers @{"Authorization"="Bearer $token"}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "byStatus": {
      "PENDING": 1,
      "VERIFIED": 2,
      "REJECTED": 0
    }
  }
}
```

---

### 4. Get Company Details
**GET** `/api/companies/:id`

Get detailed information about a specific company.

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/companies/695cfd1234abcdef12345678" `
  -Headers @{"Authorization"="Bearer $token"}
```

---

### 5. Update Company
**PUT** `/api/companies/:id`

Update company information.

**PowerShell:**
```powershell
$updateBody = @{
    email = "newemail@abcindustries.com"
    phone = "9876543299"
    numberOfEmployees = 200
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/companies/695cfd1234abcdef12345678" `
  -Method PUT `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $updateBody
```

---

### 6. Delete Company
**DELETE** `/api/companies/:id`

Delete a company.

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/companies/695cfd1234abcdef12345678" `
  -Method DELETE `
  -Headers @{"Authorization"="Bearer $token"}
```

---

## Officer Endpoints

### 7. Get All Companies (Officer View)
**GET** `/api/companies/officer/all`

Get all companies with filters (Officer only).

**Query Parameters:**
- `verificationStatus`: PENDING | VERIFIED | REJECTED
- `status`: ACTIVE | INACTIVE | SUSPENDED
- `companyType`: Company type filter
- `search`: Search by name, GST, or email
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/companies/officer/all?verificationStatus=PENDING&page=1&limit=20" `
  -Headers @{"Authorization"="Bearer $officerToken"}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companies": [...],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "pages": 3
    }
  }
}
```

---

### 8. Verify/Reject Company
**PUT** `/api/companies/officer/:id/verify`

Approve or reject a company registration (Officer only).

**Request Body:**
```json
{
  "action": "approve",  // or "reject"
  "reason": "Missing GST certificate"  // Required if rejecting
}
```

**PowerShell:**
```powershell
$verifyBody = @{
    action = "approve"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/companies/officer/695cfd1234abcdef12345678/verify" `
  -Method PUT `
  -Headers @{"Authorization"="Bearer $officerToken"; "Content-Type"="application/json"} `
  -Body $verifyBody
```

---

## Field Validations

### Company Types
- `PRIVATE_LIMITED`
- `PUBLIC_LIMITED`
- `PARTNERSHIP`
- `PROPRIETORSHIP`
- `LLP`
- `GOVERNMENT`
- `NGO`
- `TRUST`
- `SOCIETY`
- `COOPERATIVE`

### Required Fields
- ✅ Company Name
- ✅ Company Type
- ✅ Industry Type
- ✅ GST Number (format: 07AAKCS1234F1Z5)
- ✅ PAN Number (format: AAKCS1234F)
- ✅ Email
- ✅ Phone (10 digits, starts with 6-9)
- ✅ Registered Address (Line 1, State, District, Pincode)
- ✅ Authorized Person (Name, Designation)

### Optional Fields
- Company Registration Number
- CIN Number
- TAN Number
- Alternate Phone
- Website
- Communication Address
- Number of Employees
- Annual Turnover
- Date of Incorporation
- Remarks

---

## Business Logic

### 1. User-Company Relationship
- Each company is linked to a user via `userId`
- One user can register multiple companies
- Users can only view/edit their own companies

### 2. Verification Workflow
1. User registers company → Status: `PENDING`
2. Officer reviews → Approves or Rejects
3. If approved → Status: `VERIFIED`, `isApproved: true`
4. If rejected → Status: `REJECTED`, reason stored

### 3. Company Status
- `ACTIVE`: Company is active and can be used
- `INACTIVE`: Temporarily inactive
- `SUSPENDED`: Suspended by authorities

### 4. Address Handling
- If `sameAsRegistered: true`, communication address copies registered address
- Both addresses stored separately for flexibility

---

## Use Cases

### Use Case 1: Multi-Company Registration
A consultant registers clients' companies:
```
User A registers:
  - Company 1: ABC Industries
  - Company 2: XYZ Manufacturing  
  - Company 3: DEF Exports

Each company verified separately
User can track all companies in one dashboard
```

### Use Case 2: Company Profile Update
```
1. Company registered with initial details
2. Later updates: employee count, turnover, contact details
3. Major changes (GST, PAN) require re-verification
```

### Use Case 3: Officer Verification
```
1. Officer views pending companies
2. Reviews documents and details
3. Approves valid companies
4. Rejects with reason for incomplete registrations
```

---

## Integration with NOC Applications

Companies can be linked to NOC applications:
```javascript
// When creating NOC application
{
  "applicantType": "COMPANY",
  "companyId": "695cfd1234abcdef12345678",
  // ... other application details
}
```

---

## Summary

**8 Endpoints Created:**
1. POST `/api/companies/register` - Register company
2. GET `/api/companies` - List user companies
3. GET `/api/companies/stats` - Company statistics
4. GET `/api/companies/:id` - Get company details
5. PUT `/api/companies/:id` - Update company
6. DELETE `/api/companies/:id` - Delete company
7. GET `/api/companies/officer/all` - Officer: List all companies
8. PUT `/api/companies/officer/:id/verify` - Officer: Verify company

**Key Features:**
✅ Multi-company support per user  
✅ Complete CRUD operations  
✅ Verification workflow  
✅ Officer approval system  
✅ Company statistics & tracking  
✅ GST & PAN validation  
✅ Address management  
✅ Authorized person details  

**Ready to use!** 🏢
