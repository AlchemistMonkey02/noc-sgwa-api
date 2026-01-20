# Enforcement Wing - API Documentation

## Base URL
`/api/officer/enforcement`

## Authentication
All endpoints require authentication with role: `ENFORCEMENT`

---

## 1. Dashboard & Statistics

### Get Dashboard Stats
```bash
curl -X GET http://localhost:5000/api/officer/enforcement/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Compliance Statistics
```bash
curl -X GET http://localhost:5000/api/officer/enforcement/compliance/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 2. Approval Queue & Application Management

### Get Approval Queue
```bash
# Get all applications pending enforcement approval
curl -X GET "http://localhost:5000/api/officer/enforcement/approval-queue?status=PENDING&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue NOC (Final Approval)
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/applications/APP123456/issue-noc \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "validityYears": 5,
    "conditions": [
      "Install digital flow meter within 30 days",
      "Maintain daily water extraction logbook",
      "Submit quarterly compliance reports"
    ],
    "cessAmount": 50000,
    "remarks": "Approved subject to conditions"
  }'
```

### Reject Application
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/applications/APP123456/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "INSUFFICIENT_DOCUMENTATION",
    "remarks": "Environmental clearance certificate missing"
  }'
```

### Return to SGWA
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/applications/APP123456/return \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Technical review needed",
    "remarks": "Groundwater extraction calculation requires SGWA verification"
  }'
```

### Raise Query
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/applications/APP123456/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Please provide proof of rainwater harvesting installation",
    "category": "TECHNICAL",
    "deadline": "2026-02-15"
  }'
```

---

## 3. NOC Monitoring & Compliance

### Get Active NOCs
```bash
# Get all active NOCs under monitoring
curl -X GET "http://localhost:5000/api/officer/enforcement/nocs?district=DIST001&status=ACTIVE" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Revoke NOC
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/nocs/NOC123456/revoke \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "NON_COMPLIANCE",
    "remarks": "Repeated violations of extraction limits",
    "effectiveDate": "2026-02-01"
  }'
```

---

## 4. Inspections

### Schedule Compliance Inspection
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/inspections/schedule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nocId": "NOC123456",
    "applicationId": "APP123456",
    "scheduledDate": "2026-02-10",
    "inspectorId": "OFFICER789",
    "purpose": "Quarterly compliance verification",
    "checkpoints": [
      "Verify digital flow meter installation",
      "Check water extraction records",
      "Inspect rainwater harvesting system"
    ]
  }'
```

### Submit Compliance Report
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/inspections/INSP001/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "compliant": true,
    "findings": "All conditions being met",
    "recommendations": "Continue quarterly monitoring",
    "photos": ["photo1.jpg", "photo2.jpg"]
  }'
```

---

## 5. Violations & Penalties

### Issue Warning
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/violations/warning \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nocId": "NOC123456",
    "violationType": "DELAYED_REPORTING",
    "description": "Quarterly report submitted 15 days late",
    "correctionDeadline": "2026-02-15",
    "warningLevel": "FIRST"
  }'
```

### Impose Penalty
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/violations/penalty \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nocId": "NOC123456",
    "violationType": "EXCESS_EXTRACTION",
    "description": "Exceeded approved extraction limit by 20%",
    "penaltyAmount": 100000,
    "dueDate": "2026-03-01",
    "severity": "MAJOR"
  }'
```

---

## 6. Complaints Management

### Register Complaint
```bash
curl -X POST http://localhost:5000/api/officer/enforcement/complaints/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nocId": "NOC123456",
    "complaintType": "UNAUTHORIZED_EXTRACTION",
    "description": "Borewell operating without NOC approval",
    "reportedBy": "Local resident",
    "location": {
      "latitude": 28.7041,
      "longitude": 77.1025
    },
    "urgency": "HIGH"
  }'
```

### Get Complaint Details
```bash
curl -X GET http://localhost:5000/api/officer/enforcement/complaints/COMP001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Complaint Status
```bash
curl -X PUT http://localhost:5000/api/officer/enforcement/complaints/COMP001/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "RESOLVED",
    "actionTaken": "Site inspection conducted, violation confirmed and penalty imposed",
    "resolution": "NOC holder complied with regulations"
  }'
```

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

---

## Available Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard statistics |
| GET | `/compliance/stats` | Compliance statistics |
| GET | `/approval-queue` | Applications pending approval |
| POST | `/applications/:id/issue-noc` | Issue NOC certificate |
| POST | `/applications/:id/approve` | Alias for issue-noc |
| POST | `/applications/:id/reject` | Reject application |
| POST | `/applications/:id/return` | Return to SGWA |
| POST | `/applications/:id/query` | Raise query |
| GET | `/nocs` | Active NOCs |
| POST | `/nocs/:id/revoke` | Revoke NOC |
| POST | `/inspections/schedule` | Schedule inspection |
| POST | `/inspections/:id/report` | Submit inspection report |
| POST | `/violations/warning` | Issue warning |
| POST | `/violations/penalty` | Impose penalty |
| POST | `/complaints/register` | Register complaint |
| GET | `/complaints/:id` | Get complaint details |
| PUT | `/complaints/:id/status` | Update complaint status |

---

## Notes

1. All endpoints require `ENFORCEMENT` role authorization
2. NOC numbers are auto-generated in format: `NOC/STATE/YEAR/SEQUENCE`
3. Penalty amounts and cess are in INR
4. Inspection reports link to the Inspection Officer module
5. Complaint urgency levels: LOW, MEDIUM, HIGH, CRITICAL
