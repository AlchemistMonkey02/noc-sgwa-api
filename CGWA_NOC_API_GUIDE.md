# CGWA-Compliant NOC Application API Guide

## Overview
The NOC application API is now fully aligned with CGWA (Central Ground Water Authority) guidelines for groundwater extraction permits.

---

## What's New? (CGWA Phase 1)

### ✅ Mandatory CGWA Fields Added

1. **Application Categorization**
   - Application category (WITHDRAWAL/RECHARGE)
   - Sector type (INDUSTRIAL, DOMESTIC, etc.)
   - Validity period requested (1-10 years)

2. **Enhanced Water Extraction**
   - Detailed borewell specifications
   - Purpose-wise water breakup
   - Daily and annual extraction limits

3. **Hydrogeological Data**
   - Aquifer type and depth range
   - Water levels (static/dynamic)
   - Pumping test details

4. **Conservation Measures** (MANDATORY)
   - Rainwater harvesting structures
   - Recycling & reuse plans
   - Water audit mechanism

5. **Undertakings** (ALL must be accepted)
   - Information accuracy
   - Compliance agreement
   - Water meter installation
   - Inspection consent
   - Penalty acceptance

---

## Complete NOC Application Request

### POST `/api/applications/noc`

**Request Body (CGWA-Compliant):**

```json
{
  "applicationCategory": "WITHDRAWAL",
  "sectorType": "INDUSTRIAL",
  "validityPeriodRequested": 5,
  "applicationType": "NEW",
  
  "location": {
    "stateId": "22",
    "districtId": "304",
    "blockId": "2235",
    "village": "Vatika",
    "address": "Plot 123, Industrial Area, RIICO",
    "pincode": "302013",
    "latitude": 26.9124,
    "longitude": 75.7873
  },
  
  "projectDetails": {
    "projectName": "ABC Manufacturing Unit",
    "industryType": "Automobile Parts Manufacturing",
    "projectDescription": "Production facility for auto components",
    "landArea": 10000,
    "builtUpArea": 5000
  },
  
  "waterRequirement": {
    "purpose": "Industrial manufacturing and employee facilities",
    "proposedExtraction": {
      "numberOfBorewells": 2,
      "borewellDetails": [
        {
          "depth": 150,
          "diameter": 200,
          "dischargeCapacity": 100,
          "operatingHours": 8,
          "operatingDays": 26
        },
        {
          "depth": 120,
          "diameter": 150,
          "dischargeCapacity": 75,
          "operatingHours": 8,
          "operatingDays": 26
        }
      ],
      "totalDailyExtraction": 50,
      "totalAnnualExtraction": 15600
    },
    "purposeWiseBreakup": {
      "industrial": 35,
      "drinking": 10,
      "cooling": 3,
      "other": 2
    }
  },
  
  "hydrogeology": {
    "aquiferType": "UNCONFINED",
    "aquiferDepthRange": {
      "from": 80,
      "to": 180
    },
    "staticWaterLevel": 25,
    "dynamicWaterLevel": 42,
    "drawdown": 17,
    "recoveryRate": 2.5,
    "waterQuality": "POTABLE",
    "pumpingTest": {
      "conducted": true,
      "duration": 24,
      "dischargeRate": 95,
      "conductedBy": "XYZ Hydrogeology Services",
      "reportDate": "2026-01-05",
      "documentId": "doc123456"
    }
  },
  
  "conservationMeasures": {
    "rainwaterHarvesting": {
      "implemented": true,
      "structures": [
        {
          "type": "ROOFTOP",
          "capacity": 50000,
          "rechargeArea": 2000,
          "location": "Main building terrace"
        },
        {
          "type": "RECHARGE_PIT",
          "capacity": 100000,
          "rechargeArea": 500,
          "location": "Open area near parking"
        }
      ],
      "totalRechargeCapacity": 5000
    },
    "recyclingReuse": {
      "planned": true,
      "percentage": 30,
      "treatmentMethod": "Reverse Osmosis + Filtration",
      "reuseApplication": "Cooling tower and toilet flushing"
    },
    "waterAudit": {
      "mechanism": "Monthly meter readings with third-party audit",
      "frequency": "MONTHLY"
    },
    "conservationPlanDocument": {
      "uploaded": true,
      "documentId": "doc789012",
      "uploadedAt": "2026-01-05T10:30:00Z"
    }
  },
  
  "undertakings": {
    "informationAccuracy": true,
    "complianceAgreement": true,
    "waterMeterInstallation": true,
    "inspectionConsent": true,
    "penaltyAcceptance": true,
    "undertakingDate": "2026-01-07",
    "undertakingPlace": "Jaipur",
    "digitalSignature": "BASE64_ENCODED_SIGNATURE"
  },
  
  "documents": [
    {
      "documentId": "doc123456",
      "documentType": "PUMPING_TEST_REPORT"
    },
    {
      "documentId": "doc789012",
      "documentType": "CONSERVATION_PLAN"
    },
    {
      "documentId": "doc345678",
      "documentType": "LAND_OWNERSHIP"
    }
  ]
}
```

---

## CGWA Compliance Check

### GET `/api/applications/noc/:id/cgwa-compliance`

Check if your application meets CGWA norms before submission.

**Response:**

```json
{
  "success": true,
  "data": {
    "applicationId": "uuid-here",
    "applicationNumber": "NOC/RAJ/2026/00001",
    "compliance": {
      "isCompliant": false,
      "issues": [
        {
          "code": "RWH_MANDATORY",
          "severity": "CRITICAL",
          "message": "Rainwater harvesting is mandatory for daily extraction exceeding 10 KLD",
          "requirement": "CGWA Guidelines 2020"
        }
      ],
      "summary": {
        "critical": 1,
        "high": 0,
        "medium": 2
      }
    }
  },
  "message": "Application has 1 critical compliance issues"
}
```

---

## CGWA Compliance Rules

### Automatic Validation

**Rule 1: RWH Mandatory (>10 KLD)**
```
IF totalDailyExtraction > 10 KLD
  THEN rainwaterHarvesting.implemented MUST be true
  AND at least 1 RWH structure MUST be defined
```

**Rule 2: Hydrogeology Study (>100m depth)**
```
IF any borewell depth > 100 meters
  THEN hydrogeology section MUST be filled
  AND aquiferType MUST be specified
```

**Rule 3: All Undertakings Required**
```
ALL 5 undertakings MUST be TRUE:
  - informationAccuracy
  - complianceAgreement
  - waterMeterInstallation
  - inspectionConsent
  - penaltyAcceptance
```

**Rule 4: Water Audit (>100 KLD)**
```
IF totalDailyExtraction > 100 KLD
  THEN waterAudit.mechanism MUST be defined
```

**Rule 5: Recycling for Industrial**
```
IF sectorType === "INDUSTRIAL"
  THEN recyclingReuse.percentage should be >= 20%
  (Recommended, not blocking)
```

---

## Testing with PowerShell

```powershell
$token = "YOUR_JWT_TOKEN"

# Minimal CGWA-compliant request
$nocData = @{
    applicationCategory = "WITHDRAWAL"
    sectorType = "INDUSTRIAL"
    validityPeriodRequested = 3
    applicationType = "NEW"
    
    location = @{
        stateId = "22"
        districtId = "304"
        blockId = "2235"
    }
    
    projectDetails = @{
        projectName = "Test Project"
    }
    
    waterRequirement = @{
        purpose = "Industrial"
        proposedExtraction = @{
            numberOfBorewells = 1
            totalDailyExtraction = 15
        }
    }
    
    conservationMeasures = @{
        rainwaterHarvesting = @{
            implemented = $true
            structures = @(
                @{
                    type = "ROOFTOP"
                    capacity = 10000
                }
            )
        }
    }
    
    undertakings = @{
        informationAccuracy = $true
        complianceAgreement = $true
        waterMeterInstallation = $true
        inspectionConsent = $true
        penaltyAcceptance = $true
        undertakingDate = "2026-01-07"
        undertakingPlace = "Jaipur"
    }
} | ConvertTo-Json -Depth 10

# Create application
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $nocData

# Check CGWA compliance
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/APPLICATION_ID/cgwa-compliance" `
  -Headers @{"Authorization"="Bearer $token"}
```

---

## Summary of Changes

### Model Enhancements
✅ 103 new fields added  
✅ 5 major section groups  
✅ Backward compatible with existing applications  

### New Validators
✅ CGWA-compliant validation schemas  
✅ Conditional validation (RWH based on extraction)  
✅ Undertaking enforcement  

### New Endpoint
✅ `GET /api/applications/noc/:id/cgwa-compliance` - Compliance checker  

### Compliance Rules
✅ 5 automatic validation rules  
✅ Severity levels (CRITICAL/HIGH/MEDIUM)  
✅ Detailed requirement references  

---

## Benefits

**For Applicants:**
- Clear guidance on CGWA requirements
- Pre-submission compliance check
- Reduced rejection rate

**For Officers:**
- Automated compliance validation
- Complete hydrogeological data
- Enforcement of conservation norms

**For Department:**
- CGWA-compliant data collection
- Better groundwater management
- Audit trail for extractions

---

**NOC applications are now aligned with national CGWA standards!** 🌊✅
