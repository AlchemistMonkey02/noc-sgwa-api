# NOC Application Approval Workflow - FINAL

## Complete Flow: Application Submission to NOC Issuance

```
┌─────────────────────────────────────────────────────────────────┐
│                  1. APPLICANT SUBMITS NOC                       │
│         (Uploads all required documents)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                  2. DGO OFFICER REVIEW                          │
│  ✓ Views submitted application                                  │
│  ✓ Verifies documents submitted by applicant                    │
│  ✓ Can schedule inspection (assigns to Inspection Officer)      │
│  ✓ Reviews inspection report (if inspection was done)           │
│  ✓ Decision: APPROVE → SGWA                                     │
│              REJECT                                              │
│              RAISE QUERY                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ (If Approved)
┌─────────────────────────────────────────────────────────────────┐
│                  3. SGWA OFFICER REVIEW                         │
│  ✓ Reviews DGO-approved application                             │
│  ✓ Verifies documents again                                     │
│  ✓ Technical assessment                                         │
│  ✓ Can also schedule inspections if needed                      │
│  ✓ Decision: APPROVE → Enforcement                              │
│              REJECT                                              │
│              RETURN TO DGO                                       │
│              RAISE QUERY                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ (If Approved)
┌─────────────────────────────────────────────────────────────────┐
│                  4. ENFORCEMENT WING                            │
│  ✓ Final document verification                                  │
│  ✓ Final application review                                     │
│  ✓ Generates NOC Certificate                                    │
│  ✓ Decision: ISSUE NOC ✅                                       │
│              REJECT                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ (NOC Issued)
┌─────────────────────────────────────────────────────────────────┐
│                  5. APPLICANT NOTIFIED                          │
│  ✉️  Email: "Your NOC has been issued!"                        │
│  📱 SMS: "NOC issued - Download now"                            │
│  📱 WhatsApp: NOC certificate download link                     │
│  🖥️  Dashboard: NOC visible with download button               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Inspection Flow (Optional Step)

**When needed:** DGO or SGWA may schedule site inspection for verification

```
┌─────────────────────────────────────────────────────────────────┐
│     DGO/SGWA Officer schedules inspection                       │
│     (Assigns to specific Inspection Officer by ID)              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              INSPECTION OFFICER                                 │
│  1. Receives inspection assignment notification                 │
│  2. Visits site on scheduled date                               │
│  3. Verifies:                                                    │
│     - Location matches application                              │
│     - Land ownership documents                                  │
│     - Existing water sources                                    │
│     - Proposed borewell location                                │
│  4. Takes geo-tagged photos                                     │
│  5. Submits inspection report with findings                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│     DGO/SGWA reviews inspection report                          │
│     (Makes decision based on findings)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Officer Roles & Responsibilities

### 👤 DGO Officer (District Ground Water Officer)
**Primary Role:** Initial review and document verification

**✅ Can Do:**
- View all submitted applications in their district
- Verify documents submitted by applicant
- **Schedule inspection** (assigns to Inspection Officer by ID)
- **View inspection report** submitted by Inspection Officer
- Approve application (forwards to SGWA)
- Reject application
- Raise queries to applicant
- View dashboard and statistics

**❌ Cannot Do:**
- Conduct inspections themselves (only assigns to Inspection Officer)
- Issue final NOC (done by Enforcement)
- Skip SGWA review (must forward to SGWA)

---

### 👤 SGWA Officer (State Ground Water Authority)
**Primary Role:** Technical review and assessment

**✅ Can Do:**
- View applications approved by DGO
- Verify documents and application details
- Technical assessment of water requirements
- Schedule inspections (if needed for additional verification)
- View inspection reports
- Approve application (forwards to Enforcement)
- Reject application
- Return to DGO for re-review
- Raise queries to applicant

**❌ Cannot Do:**
- Conduct inspections themselves
- Issue final NOC (done by Enforcement)
- Bypass Enforcement review

---

### 👤 Enforcement Wing
**Primary Role:** Final verification and NOC issuance

**✅ Can Do:**
- View applications approved by SGWA
- Final document verification
- Final application review
- **Issue NOC Certificate** ✅
- Reject with final decision
- Monitor compliance post-NOC
- Revoke NOCs for violations
- Issue violation notices

**❌ Cannot Do:**
- Bypass earlier approvals
- Edit application data (read-only)

---

### 👤 Inspection Officer
**Primary Role:** Field verification and site visits

**✅ Can Do:**
- View assigned inspections (from DGO/SGWA)
- Visit site on scheduled date
- Upload geo-tagged photos
- Record GPS coordinates
- Submit detailed inspection report
- Mark inspection as complete

**❌ Cannot Do:**
- Approve/reject applications
- Schedule their own inspections
- Issue NOCs
- Raise queries (only submits findings)

---

## API Flow Example

### Step 1: DGO Schedules Inspection
```bash
POST /api/officer/dgo/applications/APP123/schedule-inspection
{
  "inspectorId": "INSPECTOR_001",  # Inspection Officer's ID
  "inspectionDate": "2026-01-25",
  "purpose": "Site verification",
  "checkpoints": [
    "Verify proposed borewell location",
    "Check land ownership on-site"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "status": "INSPECTION_SCHEDULED",
      "approvalFlow": {
        "dgo": {
          "inspectionAssignedTo": "INSPECTOR_001",
          "inspectionId": "INSP_12345"
        }
      }
    },
    "inspection": {
      "inspectionId": "INSP_12345",
      "status": "SCHEDULED",
      "scheduledDate": "2026-01-25"
    }
  }
}
```

### Step 2: Inspection Officer Receives Assignment
```bash
GET /api/officer/inspection/my-inspections
```

### Step 3: Inspection Officer Submits Report
```bash
POST /api/officer/inspection/INSP_12345/submit
{
  "siteVerified": true,
  "findings": "Location matches application",
  "recommendation": "RECOMMENDED",
  "photos": ["photo1.jpg", "photo2.jpg"],
  "geoLocation": { "lat": 26.9124, "lng": 75.7873 }
}
```

### Step 4: DGO Views Inspection Report
```bash
GET /api/officer/dgo/inspections/APP123/report
```

**Response:**
```json
{
  "success": true,
  "data": {
    "siteVerified": true,
    "findings": "Location matches application",
    "recommendation": "RECOMMENDED",
    "photos": ["photo1.jpg", "photo2.jpg"]
  }
}
```

### Step 5: DGO Approves Based on Report
```bash
POST /api/officer/dgo/applications/APP123/approve
{
  "recommendation": "RECOMMENDED",
  "remarks": "Inspection report positive, forwarding to SGWA"
}
```

---

## Application Status Flow

| Status | Who Set It | Next Action |
|--------|-----------|-------------|
| `SUBMITTED` | System (after user submits) | DGO reviews |
| `PENDING_DGO_REVIEW` | System | DGO verifies documents |
| `DOCUMENTS_VERIFIED` | DGO | DGO may schedule inspection |
| `INSPECTION_SCHEDULED` | DGO/SGWA | Inspection Officer visits |
| `INSPECTION_COMPLETED` | Inspection Officer | DGO/SGWA reviews report |
| `DGO_APPROVED` | DGO | SGWA reviews |
| `PENDING_SGWA_REVIEW` | System | SGWA verifies |
| `SGWA_APPROVED` | SGWA | Enforcement reviews |
| `PENDING_FINAL_APPROVAL` | System | Enforcement decides |
| `APPROVED` | Enforcement | User downloads NOC ✅ |
| `REJECTED` | Any officer | Application closed |
| `QUERY_RAISED` | Any officer | User responds |

---

## Complete cURL Test Flow

```bash
# 1. DGO schedules inspection
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP123/schedule-inspection \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectorId": "INSPECTOR_001",
    "inspectionDate": "2026-01-25",
    "purpose": "Site verification"
  }'

# 2. Inspection officer views assignment
curl -X GET http://localhost:5000/api/officer/inspection/my-inspections \
  -H "Authorization: Bearer $INSPECTOR_TOKEN"

# 3. Inspection officer submits report
curl -X POST http://localhost:5000/api/officer/inspection/INSP_12345/submit \
  -H "Authorization: Bearer $INSPECTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "siteVerified": true,
    "findings": "All details match application",
    "recommendation": "RECOMMENDED"
  }'

# 4. DGO views inspection report
curl -X GET http://localhost:5000/api/officer/dgo/inspections/APP123/report \
  -H "Authorization: Bearer $DGO_TOKEN"

# 5. DGO approves application
curl -X POST http://localhost:5000/api/officer/dgo/applications/APP123/approve \
  -H "Authorization: Bearer $DGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation": "RECOMMENDED",
    "remarks": "Documents verified, inspection positive"
  }'
```

---

## Key Points

1. ✅ **DGO schedules inspections** by assigning to Inspection Officer ID
2. ✅ **Inspection Officer conducts** the field visit
3. ✅ **DGO reviews** the inspection report before approving
4. ✅ **Three  approval flow:** DGO → SGWA → Enforcement
5. ✅ **User receives notifications** at every stage
6. ✅ **NOC available for download** after Enforcement approval
