# User Registration with Identity Documents - Quick Guide

## Overview
Register a new user and upload identity documents (Aadhaar, PAN) in a single request using multipart/form-data.

---

## Registration with Identity Documents

### POST `/api/auth/register`

**Content-Type:** `multipart/form-data`

**Fields:**
```
username: user@example.com
email: user@example.com
password: SecurePass123!
firstName: John
lastName: Doe
phone: 9876543210
userType: APPLICANT
```

**Files (Optional):**
```
aadhar: [Aadhaar PDF/Image]
pan: [PAN PDF/Image]
```

---

## PowerShell Example - Registration with Documents

```powershell
# Prepare registration form with identity documents
$form = @{
    username = "john.doe@example.com"
    email = "john.doe@example.com"
    password = "SecurePass123!"
    firstName = "John"
    lastName = "Doe"
    phone = "9876543210"
    userType = "APPLICANT"
    aadhar = Get-Item "C:\Documents\aadhaar.pdf"
    pan = Get-Item "C:\Documents\pan.pdf"
}

# Register with identity documents
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Form $form

# Get response
$result = $response.Content | ConvertFrom-Json
Write-Host "User registered! ID: $($result.data.user._id)"
```

---

## Registration WITHOUT Documents (Documents uploaded later)

```powershell
# Step 1: Register user (JSON only)
$registerBody = @{
    username = "john.doe@example.com"
    email = "john.doe@example.com"
    password = "SecurePass123!"
    firstName = "John"
    lastName = "Doe"
    phone = "9876543210"
    userType = "APPLICANT"
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $registerBody

# Step 2: Login to get token
$loginBody = '{"username":"john.doe@example.com","password":"SecurePass123!"}'
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $loginBody

$token = ($loginResponse.Content | ConvertFrom-Json).data.token

# Step 3: Upload identity documents
$docForm = @{
    files = @(
        Get-Item "C:\Documents\aadhaar.pdf"
        Get-Item "C:\Documents\pan.pdf"
    )
    documentType = "AADHAR"  # Upload one at a time with correct type
}

# Upload Aadhaar
$aadharForm = @{
    files = Get-Item "C:\Documents\aadhaar.pdf"
    documentType = "AADHAR"
}
Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"} `
  -Form $aadharForm

# Upload PAN
$panForm = @{
    files = Get-Item "C:\Documents\pan.pdf"
    documentType = "PAN"
}
Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"} `
  -Form $panForm

Write-Host "✓ User registered and identity documents uploaded!"
```

---

## Complete Workflow: Register → Upload Identity → Register Company → Upload Company Docs

```powershell
# STEP 1: Register User with Identity Documents
$registerForm = @{
    username = "john@example.com"
    email = "john@example.com"
    password = "Pass123!"
    firstName = "John"
    lastName = "Doe"
    phone = "9876543210"
    userType = "APPLICANT"
    aadhar = Get-Item "C:\Docs\aadhaar.pdf"
    pan = Get-Item "C:\Docs\pan.pdf"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Form $registerForm

Write-Host "✓ User registered with identity documents"

# STEP 2: Login
$loginBody = '{"username":"john@example.com","password":"Pass123!"}'
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $loginBody

$token = ($loginResponse.Content | ConvertFrom-Json).data.token
Write-Host "✓ Logged in successfully"

# STEP 3: Upload Company Documents (GST, MSME)
$gstForm = @{
    files = Get-Item "C:\Docs\gst_certificate.pdf"
    documentType = "GST_CERTIFICATE"
}
Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"} `
  -Form $gstForm

$msmeForm = @{
    files = Get-Item "C:\Docs\msme_certificate.pdf"
    documentType = "MSME_CERTIFICATE"
}
$msmeResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"} `
  -Form $msmeForm

$msmeDocId = ($msmeResponse.Content | ConvertFrom-Json).data[0].documentId
Write-Host "✓ Company documents uploaded"

# STEP 4: Register Company
$companyBody = @{
    companyName = "ABC Industries"
    companyType = "PRIVATE_LIMITED"
    industryType = "MANUFACTURING"
    gstNumber = "07AAKCS1234F1Z5"
    panNumber = "AAKCS1234F"
    email = "info@abc.com"
    phone = "9876543210"
    registeredAddress = @{
        addressLine1 = "Plot 123"
        city = "Jaipur"
        state = "Rajasthan"
        district = "Jaipur"
        pincode = "302013"
    }
    authorizedPerson = @{
        name = "John Doe"
        designation = "MD"
        email = "john@example.com"
        phone = "9876543210"
    }
    isMSME = $true
    msmeDetails = @{
        registrationNumber = "UDYAM-RJ-01-1234567"
        registrationDate = "2024-05-15"
        category = "SMALL"
        certificateDocument = $msmeDocId
    }
} | ConvertTo-Json -Depth 10

$companyResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/companies/register" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $companyBody

Write-Host "✓ Company registered successfully"

# NOW READY TO CREATE NOC APPLICATIONS!
Write-Host ""
Write-Host "🎉 Complete! User registered with identity docs, company registered."
Write-Host "Next: Upload NOC documents and create NOC application."
```

---

## Response Format

### Success (User Registered)
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id_here",
      "username": "john.doe@example.com",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "APPLICANT"
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  },
  "message": "User registered successfully"
}
```

---

## Summary

**Two Options:**

### Option 1: Register WITH Identity Documents (Recommended)
```
POST /api/auth/register (multipart/form-data)
- User details + Aadhaar file + PAN file
- All in one request ✅
```

### Option 2: Register THEN Upload Documents
```
1. POST /api/auth/register (JSON only)
2. POST /api/auth/login
3. POST /api/documents/upload (Aadhaar)
4. POST /api/documents/upload (PAN)
```

**Both methods work! Option 1 is simpler.** 📄✅
