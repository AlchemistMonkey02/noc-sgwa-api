# NOC Application with Company Linking - Updated Guide

## Important Change: Company Required for NOC

**Users MUST have a verified company before applying for NOC.**

---

## Prerequisites

### 1. User must be logged in
### 2. User must have at least ONE verified company

**Flow:**
```
Register User → Login → Register Company → Wait for Verification → Apply for NOC
```

---

## Step-by-Step Process

### Step 1: Register & Login
```powershell
# Register
POST /api/auth/register

# Login
POST /api/auth/login
# Save token
```

### Step 2: Register Company
```powershell
$token = "YOUR_JWT_TOKEN"
$companyData = @{
    companyName = "ABC Industries"
    companyType = "PRIVATE_LIMITED"
    industryType = "MANUFACTURING"
    gstNumber = "07AAKCS1234F1Z5"
    panNumber = "AAKCS1234F"
    email = "info@abc.com"
    phone = "9876543210"
    registeredAddress = @{
        addressLine1 = "Plot 123"
        state = "Rajasthan"
        district = "Jaipur"
        pincode = "302013"
    }
    authorizedPerson = @{
        name = "Rajesh Kumar"
        designation = "MD"
    }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:3000/api/companies/register" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $companyData

# Save company ID from response: "695cfd1234abcdef12345678"
```

### Step 3: Wait for Company Verification
**(Officer must verify the company)**

### Step 4: Apply for NOC (Now with companyId)
```powershell
$nocData = @{
    companyId = "695cfd1234abcdef12345678"  # ← REQUIRED NOW!
    applicationType = "NEW_WELL"
    projectDetails = @{
        projectName = "Industrial Borewell"
        projectLocation = @{
            state = "Rajasthan"
            district = "Jaipur"
            block = "Sanganer"
            village = "Vatika"
            surveyNumber = "123/1"
        }
    }
    waterRequirement = @{
        dailyRequirement = 100
        annualRequirement = 36500
        purpose = "INDUSTRIAL"
    }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $nocData
```

---

## Error Scenarios

### Error 1: No Company Registered
```json
{
  "success": false,
  "error": {
    "code": "COMPANY_ID_REQUIRED",
    "message": "Company ID is required for NOC application"
  }
}
```
**Solution:** Register a company first

---

### Error 2: Company Not Verified
```json
{
  "success": false,
  "error": {
    "code": "COMPANY_NOT_FOUND",
    "message": "Company not found or not verified. Please ensure you own this company and it is verified."
  }
}
```
**Solution:** Wait for officer to verify your company

---

### Error 3: Invalid Company ID
```json
{
  "success": false,
  "error": {
    "code": "COMPANY_NOT_FOUND",
    "message": "Company not found or not verified."
  }
}
```
**Solution:** Use correct company ID from your company list

---

## Get Your Companies

Before applying for NOC, get your verified companies:

```powershell
# Get all your companies
Invoke-WebRequest -Uri "http://localhost:3000/api/companies?verificationStatus=VERIFIED" `
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
        "companyName": "ABC Industries",
        "verificationStatus": "VERIFIED",
        "status": "ACTIVE"
      }
    ],
    "count": 1
  }
}
```

Use the `_id` as `companyId` in NOC application.

---

## Updated NOC Application Request

**OLD (No longer works):**
```json
{
  "applicationType": "NEW_WELL",
  "projectDetails": { ... }
}
```

**NEW (Required):**
```json
{
  "companyId": "695cfd1234abcdef12345678",  // ← Must include!
  "applicationType": "NEW_WELL",
  "projectDetails": { ... }
}
```

---

## Benefits

✅ **Traceability:** Every NOC linked to a company  
✅ **Compliance:** Ensures only registered businesses apply  
✅ **Multi-Company:** Users can apply NOC for different companies  
✅ **Data Integrity:** Company info auto-populated in applications  

---

## Complete Example Flow

```powershell
# 1. Login
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST -Headers @{"Content-Type"="application/json"} `
  -Body '{"username":"user@example.com","password":"pass123"}'
$token = ($loginResponse.Content | ConvertFrom-Json).data.token

# 2. Register Company
$companyResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/companies/register" `
  -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body '{ company data }'
$companyId = ($companyResponse.Content | ConvertFrom-Json).data._id

# 3. Wait for officer to verify (check status)
$companyStatus = Invoke-WebRequest -Uri "http://localhost:3000/api/companies/$companyId" `
  -Headers @{"Authorization"="Bearer $token"}
# Wait until verificationStatus = "VERIFIED"

# 4. Apply for NOC with companyId
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc" `
  -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body "{`"companyId`":`"$companyId`", ... noc data ...}"
```

---

## Summary of Changes

**What Changed:**
- ✅ `companyId` field added to NOC application model
- ✅ `companyId` is now **mandatory** in NOC application
- ✅ Middleware validates company exists and belongs to user
- ✅ Middleware checks company is VERIFIED and ACTIVE
- ✅ NOC application automatically linked to company

**Breaking Change:**
All NOC applications now require `companyId` in request body.

---

**Both authentication AND company verification are now required for NOC applications!** 🔒🏢
