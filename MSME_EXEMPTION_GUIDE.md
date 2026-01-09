# MSME Exemption & Additional CGWA Fields - Quick Reference

## New Fields Added

### 1. Open Land Area
```javascript
projectDetails: {
  landArea: 10000,        // Total land (sq meters)
  builtUpArea: 5000,      // Built-up area
  openLandArea: 5000      // Open land (NEW - REQUIRED)
}
```

### 2. MSME Status (Important!)
```javascript
projectDetails: {
  isMSME: true,                    // Is this an MSME unit?
  msmeDetails: {
    registrationNumber: "UDYAM-RJ-01-1234567",
    registrationDate: "2024-05-15",
    category: "SMALL",             // MICRO/SMALL/MEDIUM
    certificateDocument: "doc123"  // Document ID
  }
}
```

### 3. Green Belt Details
```javascript
projectDetails: {
  greenBelt: {
    implemented: true,
    area: 1000,                    // sq meters
    percentage: 10,                // % of total land
    plantationDetails: {
      numberOfTrees: 150,
      species: ["Neem", "Peepal", "Banyan"],
      maintenancePlan: "Monthly watering and pruning"
    },
    documentId: "doc456"
  }
}
```

---

## MSME Exemption Rule

### Eligibility for Exempted NOC
```
IF isMSME === true 
AND totalDailyExtraction < 10 KLD
THEN eligible for EXEMPTED NOC
```

**Benefits:**
- Simplified approval process
- Reduced documentation
- Faster processing

**Requirements:**
- MSME registration certificate mandatory
- Still need basic conservation measures
- Water meter installation required

---

## Green Belt Requirements

### When Required?
```
IF landArea > 1000 sq.m 
OR totalDailyExtraction > 50 KLD
THEN green belt MANDATORY
```

### Minimum Standards
- At least 10% of total land area
- Minimum 50 trees per acre
- Native species preferred
- Maintenance plan required

---

## Complete Example with All Fields

```json
{
  "projectDetails": {
    "projectName": "ABC Auto Parts Manufacturing",
    "landArea": 5000,
    "builtUpArea": 3000,
    "openLandArea": 2000,
    
    "isMSME": true,
    "msmeDetails": {
      "registrationNumber": "UDYAM-RJ-01-1234567",
      "registrationDate": "2024-05-15",
      "category": "SMALL",
      "certificateDocument": "doc_msme_cert"
    },
    
    "greenBelt": {
      "implemented": true,
      "area": 600,
      "percentage": 12,
      "plantationDetails": {
        "numberOfTrees": 80,
        "species": ["Neem", "Peepal", "Ashoka", "Gulmohar"],
        "maintenancePlan": "Weekly watering, monthly pruning, quarterly inspection"
      },
      "documentId": "doc_greenbelt_plan"
    }
  },
  
  "waterRequirement": {
    "proposedExtraction": {
      "totalDailyExtraction": 8
    }
  }
}
```

**Result:** Eligible for EXEMPTED NOC (MSME + <10 KLD)

---

## Updated Compliance Checks

### Check 0: MSME Exemption ✨ NEW
- If MSME and <10 KLD → Exempted NOC
- MSME certificate verification required

### Check 1A: Green Belt ✨ NEW  
- Land >1000 sq.m or extraction >50 KLD
- Minimum 10% of land area
- Plantation details required

### Check 1: RWH (Modified)
- Not required if MSME exempted
- Still mandatory for >10 KLD otherwise

### Check 3: Undertakings (Modified)
- Simplified for MSME exempted cases
- Full undertakings for regular NOC

---

## Testing MSME Exemption

```powershell
$nocData = @{
    projectDetails = @{
        projectName = "Small Manufacturing Unit"
        landArea = 2000
        builtUpArea = 1200
        openLandArea = 800
        
        isMSME = $true
        msmeDetails = @{
            registrationNumber = "UDYAM-RJ-01-1234567"
            registrationDate = "2024-05-15"
            category = "SMALL"
        }
        
        greenBelt = @{
            implemented = $true
            area = 250
            percentage = 12.5
        }
    }
    
    waterRequirement = @{
        proposedExtraction = @{
            numberOfBorewells = 1
            totalDailyExtraction = 7
        }
    }
} | ConvertTo-Json -Depth 10

# Check compliance
Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc/APP_ID/cgwa-compliance"
```

**Expected Result:**
```json
{
  "isCompliant": true,
  "isExempted": true,
  "issues": [{
    "code": "MSME_EXEMPTION",
    "severity": "INFO",
    "message": "MSME units with extraction < 10 KLD are eligible for exempted NOC"
  }]
}
```

---

## Summary

**3 Critical Fields Added:**
1. ✅ Open Land Area - Required for all
2. ✅ MSME Status - Get exemption if <10 KLD
3. ✅ Green Belt - Required for large projects

**Server restarting...** 🚀
