# NOC Document Upload Validation - Quick Guide

## Overview
The system now **automatically validates** that all required documents are uploaded before allowing NOC application submission.

---

## How It Works

### 1. Required Documents Are Determined Automatically

Based on your application parameters:
- Application type (NEW/RENEWAL/AMENDMENT)
- Water extraction amount
- Borewell depth
- Land area
- Sector type (INDUSTRIAL/COMMERCIAL/etc.)
- MSME status

### 2. Documents Are Validated Before Submission

When you try to submit a NOC application, thesystem checks:
- ✅ All required documents uploaded?
- ❌ If missing → **Submission blocked** with list of missing documents

---

## Required Documents by Criteria

### Always Required (All Applications)
1. ✅ Aadhaar Card
2. ✅ PAN Card
3. ✅ Land Ownership Proof
4. ✅ Site Plan with Borewell Locations
5. ✅ Undertaking (CGWA Format)
6. ✅ Water Quality Report
7. ✅ GST Certificate

### If Extraction > 10 KLD (MANDATORY!)
8. ✅ Water Conservation Plan
9. ✅ **Rainwater Harvesting Plan**

### If Extraction > 100 KLD
10. ✅ Water Audit Report

### If Borewell Depth > 100m OR Discharge > 50 LPM
11. ✅ Pumping Test Report
12. ✅ Hydrogeological Study Report

### If Land Area > 1000 sq.m OR Extraction > 50 KLD
13. ✅ Green Belt Development Plan

### If Industrial Sector
14. ✅ Factory License
15. ✅ Recycling & Reuse Plan

### If Commercial Sector
16. ✅ Trade License

### If MSME Company
17. ✅ MSME Registration Certificate

### If Renewal/Amendment
18. ✅ Existing NOC Copy
19. ✅ Water Audit/Compliance Report

---

## Check Document Status API

### GET `/api/applications/noc/:id/documents/status`

Check which documents are uploaded and which are still missing.

**PowerShell:**
```powershell
$token = "YOUR_JWT_TOKEN"
$appId = "YOUR_APPLICATION_ID"

Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/$appId/documents/status" `
  -Headers @{"Authorization"="Bearer $token"}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "uuid",
    "documentStatus": {
      "isComplete": false,
      "requiredDocuments": [
        "AADHAR",
        "PAN",
        "LAND_OWNERSHIP",
        "SITE_PLAN",
        "UNDERTAKING",
        "WATER_QUALITY_REPORT",
        "GST_CERTIFICATE",
        "RAINWATER_HARVESTING_PLAN",
        "CONSERVATION_PLAN"
      ],
      "uploadedDocuments": [
        "AADHAR",
        "PAN",
        "LAND_OWNERSHIP",
        "SITE_PLAN"
      ],
      "missingDocuments": [
        "UNDERTAKING",
        "WATER_QUALITY_REPORT",
        "GST_CERTIFICATE",
        "RAINWATER_HARVESTING_PLAN",
        "CONSERVATION_PLAN"
      ],
      "totalRequired": 9,
      "totalUploaded": 4,
      "completionPercentage": 44
    },
    "canSubmit": false
  },
  "message": "5 document(s) still required"
}
```

---

## What Happens When You Submit Without All Documents?

### Attempt to Submit
```powershell
POST /api/applications/noc/:id/submit
```

### Error Response (Documents Missing)
```json
{
  "success": false,
  "error": {
    "code": "DOCUMENTS_INCOMPLETE",
    "message": "Cannot submit application. 5 required document(s) missing.",
    "details": {
      "completionPercentage": 44,
      "totalRequired": 9,
      "totalUploaded": 4,
      "missingDocuments": [
        "UNDERTAKING",
        "WATER_QUALITY_REPORT",
        "GST_CERTIFICATE",
        "RAINWATER_HARVESTING_PLAN",
        "CONSERVATION_PLAN"
      ],
      "missingDocumentNames": [
        "Undertaking (CGWA Format)",
        "Water Quality Analysis Report",
        "GST Registration Certificate",
        "Rainwater Harvesting Plan",
        "Water Conservation Plan"
      ]
    }
  }
}
```

---

## Complete Workflow with Document Validation

```powershell
$token = "YOUR_JWT_TOKEN"

# Step 1: Create NOC Application (Draft)
$nocBody = @{
    applicationCategory = "WITHDRAWAL"
    sectorType = "INDUSTRIAL"
    validityPeriodRequested = 3
    applicationType = "NEW"
    location = @{stateId="22"; districtId="304"; blockId="2235"}
    projectDetails = @{
        projectName = "ABC Manufacturing"
        landArea = 5000
        isMSME = $true
    }
    waterRequirement = @{
        purpose = "Industrial"
        proposedExtraction = @{
            numberOfBorewells = 2
            totalDailyExtraction = 15  # > 10 KLD = RWH mandatory!
        }
    }
    conservationMeasures = @{
        rainwaterHarvesting = @{implemented = $true}
    }
    undertakings = @{
        informationAccuracy=$true; complianceAgreement=$true
        waterMeterInstallation=$true; inspectionConsent=$true
        penaltyAcceptance=$true; undertakingDate="2026-01-07"
        undertakingPlace="Jaipur"
    }
} | ConvertTo-Json -Depth 10

$nocResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $nocBody

$appId = ($nocResponse.Content | ConvertFrom-Json).data.applicationId

# Step 2: Check what documents are required
$statusResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/$appId/documents/status" `
  -Headers @{"Authorization"="Bearer $token"}

$status = ($statusResponse.Content | ConvertFrom-Json).data.documentStatus
Write-Host "Required Documents: $($status.totalRequired)"
Write-Host "Missing: $($status.missingDocuments -join ', ')"

# Step 3: Upload ALL required documents
$requiredDocs = @{
    "AADHAR" = "C:\Docs\aadhaar.pdf"
    "PAN" = "C:\Docs\pan.pdf"
    "LAND_OWNERSHIP" = "C:\Docs\land_deed.pdf"
    "SITE_PLAN" = "C:\Docs\site_plan.pdf"
    "UNDERTAKING" = "C:\Docs\undertaking.pdf"
    "WATER_QUALITY_REPORT" = "C:\Docs\water_quality.pdf"
    "GST_CERTIFICATE" = "C:\Docs\gst_cert.pdf"
    "RAINWATER_HARVESTING_PLAN" = "C:\Docs\rwh_plan.pdf"
    "CONSERVATION_PLAN" = "C:\Docs\conservation.pdf"
    "FACTORY_LICENSE" = "C:\Docs\factory_license.pdf"
    "RECYCLING_PLAN" = "C:\Docs\recycling.pdf"
    "MSME_CERTIFICATE" = "C:\Docs\msme_cert.pdf"
}

foreach ($docType in $requiredDocs.Keys) {
    $form = @{
        files = Get-Item $requiredDocs[$docType]
        documentType = $docType
    }
    
    Invoke-WebRequest -Uri "http://localhost:3000/api/documents/upload" `
      -Method POST `
      -Headers @{"Authorization"="Bearer $token"} `
      -Form $form
    
    Write-Host "✓ Uploaded: $docType"
}

# Step 4: Verify all documents uploaded
$finalStatus = Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/$appId/documents/status" `
  -Headers @{"Authorization"="Bearer $token"}

$final = ($finalStatus.Content | ConvertFrom-Json).data
if ($final.canSubmit) {
    Write-Host "✅ All documents uploaded! Can submit now."
    
    # Step 5: Submit application
    Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/$appId/submit" `
      -Method POST `
      -Headers @{"Authorization"="Bearer $token"}
    
    Write-Host "🎉 NOC Application Submitted Successfully!"
} else {
    Write-Host "❌ Still missing: $($final.documentStatus.missingDocuments -join ', ')"
}
```

---

## Benefits

✅ **Automatic Validation** - No manual checks needed  
✅ **Clear Error Messages** - Know exactly what's missing  
✅ **Progress Tracking** - See completion percentage  
✅ **Smart Requirements** - Based on your specific application  
✅ **Prevents Rejection** - Can't submit incomplete applications  

---

## Summary

**Before:** Users could submit NOC without all documents → Rejected later  
**Now:** System validates documents → Blocks submission if incomplete → Clear list of what's missing

**Check Status:** `GET /api/applications/noc/:id/documents/status`  
**Upload Documents:** `POST /api/documents/upload`  
**Submit (Only if complete):** `POST /api/applications/noc/:id/submit`

**All document validation is automatic!** 📄✅
