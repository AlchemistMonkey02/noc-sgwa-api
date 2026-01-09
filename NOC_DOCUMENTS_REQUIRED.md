# Complete NOC Application - Required Documents List

## Overview
Comprehensive list of all documents required for CGWA-compliant NOC applications, organized by category.

---

## 1. Mandatory Documents (All Applications)

### A. Identity & Company Documents
| Document | Type Code | When Required |
|----------|-----------|---------------|
| Aadhaar Card (Authorized Person) | `AADHAR` | Always |
| PAN Card (Company/Individual) | `PAN` | Always |
| GST Certificate | `GST_CERTIFICATE` | If registered |
| Company Registration/Incorporation | `INCORPORATION_CERTIFICATE` | For companies |
| MSME Certificate | `MSME_CERTIFICATE` | If claiming MSME exemption |

### B. Land/Property Documents
| Document | Type Code | When Required |
|----------|-----------|---------------|
| Land Ownership Proof | `LAND_OWNERSHIP` | Always |
| Khasra/Khatauni | `KHASRA_KHATAUNI` | Always |
| Revenue Records | `REVENUE_RECORDS` | Always |
| Sale Deed | `SALE_DEED` | If owned |
| Lease Deed | `LEASE_DEED` | If leased |

### C. Site/Project Documents
| Document | Type Code | When Required |
|----------|-----------|---------------|
| Site Plan with Borewell Locations | `SITE_PLAN` | Always |
| Building/Construction Plan | `BUILDING_PLAN` | For new constructions |
| Layout Plan | `LAYOUT_PLAN` | For industrial units |

---

## 2. CGWA Technical Documents

### A. Hydrogeological Data (Mandatory)
| Document | Type Code | When Required |
|----------|-----------|---------------|
| Pumping Test Report | `PUMPING_TEST_REPORT` | If depth > 100m or discharge > 50 LPM |
| Hydrogeological Study Report | `HYDROGEOLOGICAL_REPORT` | If depth > 100m |
| Borewell Completion Report | `BOREWELL_COMPLETION_REPORT` | After drilling |
| Geophysical Survey Report | `GEOPHYSICAL_SURVEY` | For critical areas |

### B. Water Quality Documents
| Document | Type Code | When Required |
|----------|-----------|---------------|
| Water Quality Analysis Report | `WATER_QUALITY_REPORT` | Always |
| Water Analysis Certificate | `WATER_ANALYSIS` | From recognized lab |

### C. Conservation Measures (Mandatory)
| Document | Type Code | When Required |
|----------|-----------|---------------|
| Water Conservation Plan | `CONSERVATION_PLAN` | If extraction > 10 KLD |
| Rainwater Harvesting Plan | `RAINWATER_HARVESTING_PLAN` | If extraction > 10 KLD (MANDATORY) |
| Green Belt Plan | `GREEN_BELT_PLAN` | If land > 1000 sq.m or extraction > 50 KLD |
| Recycling & Reuse Plan | `RECYCLING_PLAN` | For industrial sector |
| Water Audit Report | `WATER_AUDIT_REPORT` | If extraction > 100 KLD |

---

## 3. Clearances & Permissions

### A. Environmental Clearances
| Document | Type Code | When Required |
|----------|-----------|---------------|
| Environmental Clearance (EC) | `EC_CERTIFICATE` | For projects requiring EC |
| Consent to Establish (CTE) | `CTO_CTE` | From pollution board |
| Consent to Operate (CTO) | `CTO_CTE` | From pollution board |
| Pollution Control NOC | `POLLUTION_NOC` | If applicable |
| Forest Clearance | `FOREST_CLEARANCE` | If in forest area |

### B. Trade/Business Licenses
| Document | Type Code | When Required |
|----------|-----------|---------------|
| Factory License | `FACTORY_LICENSE` | For manufacturing units |
| Trade License | `TRADE_LICENSE` | For commercial establishments |

---

## 4. Legal Documents

| Document | Type Code | When Required |
|----------|-----------|---------------|
| Undertaking (CGWA Format) | `UNDERTAKING` | Always (MANDATORY) |
| Affidavit | `AFFIDAVIT` | As per requirement |
| Indemnity Bond | `INDEMNITY_BOND` | If required |

---

## 5. For Renewal/Amendment Applications

| Document | Type Code | When Required |
|----------|-----------|---------------|
| Existing NOC Copy | `EXISTING_NOC` | Always (for renewal) |
| Compliance Report | `WATER_AUDIT_REPORT` | Showing actual vs approved extraction |

---

## 6. Technical Reports

| Document | Type Code | When Required |
|----------|-----------|---------------|
| Soil Investigation Report | `SOIL_INVESTIGATION_REPORT` | For foundation/structural |
| Geophysical Survey | `GEOPHYSICAL_SURVEY` | For aquifer mapping |

---

## Document Requirements by Application Type

### NEW Application
**Mandatory:**
- ✅ All identity & company documents
- ✅ Land ownership documents
- ✅ Site plan
- ✅ Conservation plan (if > 10 KLD)
- ✅ RWH plan (if > 10 KLD)
- ✅ Green belt plan (if > 1000 sq.m)
- ✅ Undertaking
- ✅ Water quality report

**If Applicable:**
- Pumping test report (depth > 100m)
- Hydrogeological report (depth > 100m)
- EC/CTO/CTE certificates
- MSME certificate (for exemption)

### RENEWAL Application
**Mandatory:**
- ✅ Existing NOC
- ✅ Compliance/water audit report
- ✅ Actual extraction data
- ✅ Undertaking
- ✅ Updated conservation plan

### AMENDMENT Application
**Mandatory:**
- ✅ Existing NOC
- ✅ Reason for amendment
- ✅ Revised technical details
- ✅ Updated plans (if changing extraction)

---

## Document Size & Format Requirements

### File Formats
- ✅ **Accepted:** PDF, PNG, JPG, JPEG
- ❌ **Not Accepted:** DOC, DOCX, XLS (convert to PDF)

### File Sizes
- **Maximum per file:** 5 MB
- **Total per application:** 50 MB
- **Recommendation:** Compress large PDFs

### Quality Requirements
- Scanned documents: Minimum 200 DPI
- Clear and readable
- All pages included
- Properly oriented

---

## Document Upload Workflow

### Step 1: Prepare Documents
```
✓ Scan all physical documents
✓ Convert to PDF format
✓ Ensure file size < 5 MB each
✓ Name files clearly (e.g., "land_ownership_deed.pdf")
```

### Step 2: Upload via API
```powershell
# Upload each document type
POST /api/documents/upload
Headers: Authorization: Bearer {token}
Body: multipart/form-data
  - files: document.pdf
  - documentType: "LAND_OWNERSHIP"
```

### Step 3: Get Document IDs
```json
Response: {
  "documentId": "uuid-here"  // Save this!
}
```

### Step 4: Reference in NOC Application
```json
{
  "documents": [
    { "documentId": "uuid1", "documentType": "LAND_OWNERSHIP" },
    { "documentId": "uuid2", "documentType": "PUMPING_TEST_REPORT" }
  ]
}
```

---

## Quick Checklist

### Before Submission
- [ ] All mandatory documents uploaded
- [ ] Document types correctly labeled
- [ ] File sizes within limits
- [ ] All documents readable/clear
- [ ] Documents linked in NOC application
- [ ] Conservation plan (if required)
- [ ] RWH plan (if extraction > 10 KLD)
- [ ] Green belt plan (if land > 1000 sq.m)
- [ ] Undertaking signed and uploaded
- [ ] Water quality report recent (< 6 months)

---

## DocumentType Enum (For API)

```javascript
// Use these exact strings when uploading
"AADHAR"
"PAN"
"LAND_OWNERSHIP"
"KHASRA_KHATAUNI"
"REVENUE_RECORDS"
"SALE_DEED"
"LEASE_DEED"
"SITE_PLAN"
"BUILDING_PLAN"
"LAYOUT_PLAN"
"PUMPING_TEST_REPORT"
"HYDROGEOLOGICAL_REPORT"
"WATER_QUALITY_REPORT"
"WATER_ANALYSIS"
"CONSERVATION_PLAN"
"RAINWATER_HARVESTING_PLAN"
"GREEN_BELT_PLAN"
"WATER_AUDIT_REPORT"
"RECYCLING_PLAN"
"EXISTING_NOC"
"EC_CERTIFICATE"
"CTO_CTE"
"POLLUTION_NOC"
"FOREST_CLEARANCE"
"FACTORY_LICENSE"
"TRADE_LICENSE"
"GST_CERTIFICATE"
"MSME_CERTIFICATE"
"INCORPORATION_CERTIFICATE"
"PARTNERSHIP_DEED"
"UNDERTAKING"
"AFFIDAVIT"
"INDEMNITY_BOND"
"BOREWELL_COMPLETION_REPORT"
"SOIL_INVESTIGATION_REPORT"
"GEOPHYSICAL_SURVEY"
"OTHER"
```

---

## Summary

**Total Document Types:** 40+

**Always Required (Minimum):**
1. Identity documents (Aadhaar, PAN)
2. Land ownership proof
3. Site plan
4. Undertaking
5. Water quality report

**Conditionally Required:**
6. RWH plan (if > 10 KLD)
7. Green belt plan (if > 1000 sq.m)
8. Pumping test (if depth > 100m)
9. MSME certificate (if claiming exemption)
10. Existing NOC (for renewal)

**Server has been updated with all 40+ document types!** 📄✅
