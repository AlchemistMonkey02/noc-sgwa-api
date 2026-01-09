# Document Upload API - Organized by Use Case

## Overview
Dedicated document upload endpoints for different purposes with automatic validation and categorization.

---

## 1. Upload Documents for NOC Application

### POST `/api/documents/upload/noc`

Upload NOC-specific documents (pumping test, conservation plan, etc.)

**Purpose:** Documents required during NOC application submission

**Automatic Actions:**
- Links to user & company
- Validates against CGWA requirements
- Returns document IDs for NOC form

**PowerShell Example:**
```powershell
$token = "YOUR_JWT_TOKEN"

$form = @{
    files = @(
        Get-Item "C:\Docs\pumping_test.pdf"
        Get-Item "C:\Docs\conservation_plan.pdf"
        Get-Item "C:\Docs\land_ownership.pdf"
    )
    documentTypes = "PUMPING_TEST_REPORT,CONSERVATION_PLAN,LAND_OWNERSHIP"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload/noc" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"} `
  -Form $form
```

**Accepted Document Types:**
- PUMPING_TEST_REPORT
- HYDROGEOLOGICAL_REPORT
- CONSERVATION_PLAN
- RAINWATER_HARVESTING_PLAN
- GREEN_BELT_PLAN
- WATER_ANALYSIS
- LAND_OWNERSHIP
- SITE_PLAN
- UNDERTAKING
- (All CGWA-related docs)

---

## 2. Upload Documents for Company Registration

### POST `/api/documents/upload/company`

Upload company registration documents

**Purpose:** Documents needed for company verification

**PowerShell Example:**
```powershell
$form = @{
    files = @(
        Get-Item "C:\Docs\gst_cert.pdf"
        Get-Item "C:\Docs\msme_cert.pdf"
    )
    documentTypes = "GST_CERTIFICATE,MSME_CERTIFICATE"
    companyId = "company_id_here"  # Optional if only one company
}

Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload/company" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"} `
  -Form $form
```

**Accepted Document Types:**
- GST_CERTIFICATE
- MSME_CERTIFICATE
- INCORPORATION_CERTIFICATE
- PARTNERSHIP_DEED
- PAN
- TRADE_LICENSE
- FACTORY_LICENSE

---

## 3. Upload User Identity Documents

### POST `/api/documents/upload/identity`

Upload user identity/profile documents

**Purpose:** User verification documents

**PowerShell Example:**
```powershell
$form = @{
    files = Get-Item "C:\Docs\aadhaar.pdf"
    documentType = "AADHAR"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload/identity" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"} `
  -Form $form
```

**Accepted Document Types:**
- AADHAR
- PAN
- AFFIDAVIT
- INDEMNITY_BOND

---

## 4. Upload Clearance/License Documents

### POST `/api/documents/upload/clearances`

Upload environmental/statutory clearances

**Purpose:** Regulatory clearance documents

**PowerShell Example:**
```powershell
$form = @{
    files = @(
        Get-Item "C:\Docs\ec_cert.pdf"
        Get-Item "C:\Docs\cto.pdf"
    )
    documentTypes = "EC_CERTIFICATE,CTO_CTE"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload/clearances" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"} `
  -Form $form
```

**Accepted Document Types:**
- EC_CERTIFICATE
- CTO_CTE
- POLLUTION_NOC
- FOREST_CLEARANCE
- EXISTING_NOC

---

## 5. General Document Upload (All Types)

### POST `/api/documents/upload`

Upload any document type (generic endpoint)

**Purpose:** Flexible upload for any document

**PowerShell Example:**
```powershell
$form = @{
    files = Get-Item "C:\Docs\document.pdf"
    documentType = "OTHER"
    companyId = "optional_company_id"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"} `
  -Form $form
```

---

## Quick Reference by Use Case

### Use Case 1: Submitting New NOC Application
```powershell
# Step 1: Upload NOC documents
$nocDocs = Invoke-WebRequest ... /upload/noc
$pumpingTestId = ($nocDocs.Content | ConvertFrom-Json).data[0].documentId
$conservationId = ($nocDocs.Content | ConvertFrom-Json).data[1].documentId

# Step 2: Submit NOC with document IDs
POST /api/applications/noc
Body: {
  documents: [
    { documentId: $pumpingTestId, documentType: "PUMPING_TEST_REPORT" },
    { documentId: $conservationId, documentType: "CONSERVATION_PLAN" }
  ]
}
```

### Use Case 2: Registering MSME Company
```powershell
# Step 1: Upload company documents
POST /api/documents/upload/company
Files: GST cert, MSME cert, PAN

# Step 2: Get document IDs
# Step 3: Register company with document references
POST /api/companies/register
Body: {
  msmeDetails: {
    certificateDocument: $msmeDocId
  }
}
```

### Use Case 3: User Profile Verification
```powershell
# Upload identity documents
POST /api/documents/upload/identity
Files: Aadhaar, PAN
```

---

## Response Format (All Endpoints)

```json
{
  "success": true,
  "data": [
    {
      "documentId": "uuid-here",
      "_id": "mongo-id",
      "fileName": "pumping_test.pdf",
      "documentType": "PUMPING_TEST_REPORT",
      "fileSize": 2548576,
      "uploadedAt": "2026-01-07T05:40:12.000Z",
      "userId": "user-id-from-token",
      "companyId": "company-id-from-token",
      "category": "NOC"  // Based on endpoint used
    }
  ],
  "message": "1 document(s) uploaded successfully"
}
```

---

## Document Validation by Endpoint

| Endpoint | Validates | Auto-Sets Category |
|----------|-----------|-------------------|
| `/upload/noc` | CGWA document types | `NOC` |
| `/upload/company` | Company document types | `COMPANY` |
| `/upload/identity` | Identity document types | `IDENTITY` |
| `/upload/clearances` | Clearance document types | `CLEARANCE` |
| `/upload` | All types | `GENERAL` |

---

## Error Handling

### Invalid Document Type for Category
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DOCUMENT_TYPE",
    "message": "Document type 'AADHAR' not allowed for NOC uploads. Use /upload/identity instead.",
    "allowedTypes": ["PUMPING_TEST_REPORT", "CONSERVATION_PLAN", ...]
  }
}
```

### Missing Required Fields
```json
{
  "success": false,
  "error": {
    "code": "MISSING_DOCUMENT_TYPE",
    "message": "Document type is required when uploading multiple files"
  }
}
```

---

## Complete Workflow Example

```powershell
$token = "YOUR_JWT_TOKEN"

# 1. Upload identity documents
$identityForm = @{
    files = Get-Item "C:\Docs\aadhaar.pdf"
    documentType = "AADHAR"
}
Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload/identity" `
  -Method POST -Headers @{"Authorization"="Bearer $token"} -Form $identityForm

# 2. Upload company documents
$companyForm = @{
    files = @(Get-Item "C:\Docs\gst.pdf", Get-Item "C:\Docs\msme.pdf")
    documentTypes = "GST_CERTIFICATE,MSME_CERTIFICATE"
}
$companyDocs = Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload/company" `
  -Method POST -Headers @{"Authorization"="Bearer $token"} -Form $companyForm

# 3. Upload NOC technical documents
$nocForm = @{
    files = @(
        Get-Item "C:\Docs\pumping_test.pdf"
        Get-Item "C:\Docs\conservation.pdf"
        Get-Item "C:\Docs\green_belt.pdf"
    )
    documentTypes = "PUMPING_TEST_REPORT,CONSERVATION_PLAN,GREEN_BELT_PLAN"
}
$nocDocs = Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload/noc" `
  -Method POST -Headers @{"Authorization"="Bearer $token"} -Form $nocForm

# 4. Submit NOC application with all document IDs
$nocData = @{
    # ... NOC fields ...
    documents = ($nocDocs.Content | ConvertFrom-Json).data
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc" `
  -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $nocData
```

---

## Summary

**5 Upload Endpoints:**
1. `/api/documents/upload/noc` - NOC-specific docs
2. `/api/documents/upload/company` - Company docs
3. `/api/documents/upload/identity` - Identity docs
4. `/api/documents/upload/clearances` - Regulatory docs
5. `/api/documents/upload` - General (all types)

**Benefits:**
- ✅ Organized by use case
- ✅ Automatic validation
- ✅ Clear categorization
- ✅ Better error messages
- ✅ Easier frontend integration

**All endpoints auto-link userId and companyId from JWT token!** 📄✨
