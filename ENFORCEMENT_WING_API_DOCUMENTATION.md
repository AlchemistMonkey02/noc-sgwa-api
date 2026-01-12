# Enforcement Wing Portal - Complete API Reference
**Groundwater Enforcement & Compliance - API Documentation v1.0**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Dashboard & Statistics](#dashboard--statistics)
4. [NOC Monitoring](#noc-monitoring)
5. [Inspection Management](#inspection-management)
6. [Violation Management](#violation-management)
7. [Penalty & Warning System](#penalty--warning-system)
8. [Complaint Management](#complaint-management)
9. [NOC Cancellation](#noc-cancellation)
10. [Field Operations](#field-operations)
11. [Reports & Analytics](#reports--analytics)
12. [Real-time Monitoring](#real-time-monitoring)
13. [Workflows & Use Cases](#workflows--use-cases)
14. [Testing Guide](#testing-guide)

---

## Overview

### Base URL
```
Production: https://enforcement.sgwa.rajasthan.gov.in/api
Development: http://localhost:3000/api
```

### Officer Roles
- **Enforcement Officer** - Field inspections, violations, warnings
- **Senior Enforcement Officer** - Approvals, penalties, cancellations
- **Enforcement Coordinator** - Complaint management, scheduling

### Key Features
- ✅ Real-time NOC compliance monitoring
- ✅ Automated violation detection
- ✅ Mobile-first field inspection tools
- ✅ Geolocation-based tracking
- ✅ Public complaint management
- ✅ Penalty calculation & imposition
- ✅ NOC suspension/cancellation workflow

---

## Authentication

### 1. Enforcement Officer Login

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "enforcement.officer@sgwa.gov.in",
  "password": "Enforce@2026",
  "userType": "ENFORCEMENT",
  "captcha": "5A7K9"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600,
    "user": {
      "id": "enforcement-officer-uuid",
      "username": "enforcement.officer@sgwa.gov.in",
      "name": "Vikram Singh Rathore",
      "designation": "Senior Enforcement Officer",
      "department": "Enforcement Wing",
      "userType": "ENFORCEMENT",
      "employeeId": "ENF/RJ/2023/0145",
      "jurisdiction": {
        "type": "DISTRICT",
        "districts": ["Jaipur", "Dausa"],
        "zones": ["Zone-A", "Zone-B"]
      },
      "permissions": [
        "CONDUCT_INSPECTIONS",
        "ISSUE_WARNINGS",
        "IMPOSE_PENALTIES",
        "INITIATE_CANCELLATION",
        "MANAGE_COMPLAINTS",
        "ACCESS_MONITORING_SYSTEM",
        "GENERATE_REPORTS"
      ],
      "fieldOfficer": true,
      "mobileAccess": true,
      "contactNumber": "+91-9876543210",
      "email": "enforcement.officer@sgwa.gov.in"
    }
  }
}
```

### 2. Mobile App Login (for Field Officers)

```http
POST /api/auth/mobile-login
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "field.officer@sgwa.gov.in",
  "password": "Field@2026",
  "deviceId": "device-unique-id",
  "deviceInfo": {
    "model": "Samsung Galaxy S21",
    "os": "Android 12",
    "appVersion": "2.1.0"
  }
}
```

---

## Dashboard & Statistics

### 1. Enforcement Dashboard

```http
GET /api/officer/enforcement/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "activeNOCs": 450,
      "compliantNOCs": 380,
      "nonCompliantNOCs": 45,
      "underWarning": 25,
      "inspectionsThisMonth": 85,
      "inspectionsPending": 12,
      "inspectionsScheduled": 8,
      "violationsDetected": 32,
      "warningsIssued": 18,
      "penaltiesImposed": 8,
      "noCsCancelled": 2,
      "activeComplaints": 25,
      "complaintsResolved": 40,
      "recoveredPenaltyAmount": 850000
    },
    "districtWise": [
      {
        "district": "Jaipur",
        "activeNOCs": 280,
        "compliant": 240,
        "violations": 20,
        "inspectionsDue": 15
      },
      {
        "district": "Dausa",
        "activeNOCs": 170,
        "compliant": 140,
        "violations": 12,
        "inspectionsDue": 8
      }
    ],
    "recentInspections": [
      {
        "inspectionId": "insp-uuid-1",
        "nocNumber": "RJ/CGWA/NOC/2024/00123",
        "holderName": "ABC Industries Ltd",
        "location": "Sanganer, Jaipur",
        "inspectionDate": "2026-01-11",
        "inspector": "Ramesh Kumar",
        "status": "COMPLETED",
        "complianceStatus": "NON_COMPLIANT",
        "violationsFound": 2,
        "actionTaken": "WARNING_ISSUED"
      },
      {
        "inspectionId": "insp-uuid-2",
        "nocNumber": "RJ/CGWA/NOC/2025/00456",
        "holderName": "Hotel Grand Plaza",
        "location": "Ajmer Road, Jaipur",
        "inspectionDate": "2026-01-10",
        "inspector": "Priya Sharma",
        "status": "COMPLETED",
        "complianceStatus": "COMPLIANT",
        "violationsFound": 0,
        "actionTaken": "NONE"
      }
    ],
    "upcomingInspections": [
      {
        "inspectionId": "insp-uuid-3",
        "nocNumber": "RJ/CGWA/NOC/2025/00789",
        "holderName": "XYZ Manufacturing",
        "scheduledDate": "2026-01-15T10:00:00Z",
        "inspector": "Vikram Singh",
        "inspectionType": "ROUTINE",
        "location": "Kukas, Jaipur"
      }
    ],
    "alerts": [
      {
        "id": "alert-1",
        "type": "OVERDUE_INSPECTION",
        "severity": "HIGH",
        "message": "12 NOCs pending inspection for > 90 days",
        "count": 12,
        "actionRequired": true
      },
      {
        "id": "alert-2",
        "type": "REPEATED_VIOLATIONS",
        "severity": "CRITICAL",
        "message": "5 NOC holders with repeated violations",
        "count": 5,
        "actionRequired": true
      },
      {
        "id": "alert-3",
        "type": "PENDING_PENALTIES",
        "severity": "MEDIUM",
        "message": "₹2,50,000 in penalties pending recovery",
        "actionRequired": false
      }
    ],
    "violationTrends": {
      "monthlyViolations": [12, 15, 18, 22, 20, 32],
      "months": ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
      "topViolationTypes": [
        {
          "type": "EXCESS_EXTRACTION",
          "count": 45,
          "percentage": 35
        },
        {
          "type": "METER_TAMPERING",
          "count": 28,
          "percentage": 22
        },
        {
          "type": "NO_METER_INSTALLATION",
          "count": 20,
          "percentage": 15
        }
      ]
    }
  }
}
```

### 2. Field Officer Daily Summary

```http
GET /api/officer/enforcement/daily-summary?date=2026-01-12
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-12",
    "officer": {
      "id": "officer-uuid",
      "name": "Vikram Singh Rathore"
    },
    "scheduledInspections": 3,
    "completedInspections": 2,
    "pendingInspections": 1,
    "travelledDistance": 45.5,
    "violationsReported": 1,
    "complaintsVisited": 2,
    "workingHours": 7.5,
    "inspectionDetails": [...]
  }
}
```

---

## NOC Monitoring

### 1. Get All Active NOCs

```http
GET /api/officer/enforcement/active-nocs
Authorization: Bearer {token}
```

**Query Parameters:**
```
?district=Jaipur
&complianceStatus=NON_COMPLIANT
&waterMeterStatus=NOT_INSTALLED
&lastInspectionBefore=2025-10-01
&expiringWithin=30
&page=1
&limit=20
```

**Available Filters:**
- `district` - Filter by district
- `block` - Filter by block
- `complianceStatus` - COMPLIANT, NON_COMPLIANT, WARNING, PENALTY_IMPOSED
- `waterMeterStatus` - INSTALLED, NOT_INSTALLED, MALFUNCTIONING, TAMPERED
- `lastInspectionBefore` - NOCs not inspected since date
- `expiringWithin` - NOCs expiring within days
- `violationHistory` - true/false
- `search` - Search by NOC number or holder name

**Response:**
```json
{
  "success": true,
  "data": {
    "nocs": [
      {
        "nocId": "noc-uuid-1",
        "nocNumber": "RJ/CGWA/NOC/2024/00123",
        "holder": {
          "id": "holder-uuid-1",
          "name": "ABC Industries Ltd",
          "type": "COMPANY",
          "contactPerson": "Mr. Rajesh Gupta",
          "phone": "+91-9876543210",
          "email": "rajesh@abcindustries.com"
        },
        "project": {
          "name": "Steel Manufacturing Unit",
          "sector": "Industry",
          "type": "Heavy Industry"
        },
        "location": {
          "district": "Jaipur",
          "block": "Sanganer",
          "village": "Kukas",
          "address": "Plot 45, Industrial Area, Kukas",
          "coordinates": {
            "latitude": 26.8467,
            "longitude": 75.7873
          }
        },
        "nocDetails": {
          "issueDate": "2024-06-15",
          "validFrom": "2024-06-15",
          "validUpto": "2027-06-14",
          "daysToExpiry": 519,
          "status": "ACTIVE"
        },
        "waterAllocation": {
          "dailyLimit": 150,
          "annualLimit": 54750,
          "unit": "m³"
        },
        "compliance": {
          "status": "NON_COMPLIANT",
          "waterMeterInstalled": true,
          "waterMeterStatus": "TAMPERED",
          "lastMeterReading": {
            "date": "2026-01-10",
            "reading": 52000,
            "submittedBy": "Meter Reader"
          },
          "lastInspectionDate": "2025-12-15",
          "daysSinceInspection": 28,
          "nextInspectionDue": "2026-03-15",
          "complianceReportsDue": 1,
          "violationsCount": 2,
          "warningsCount": 1,
          "penaltiesCount": 0
        },
        "violations": [
          {
            "id": "viol-uuid-1",
            "type": "METER_TAMPERING",
            "detectedOn": "2025-12-15",
            "severity": "HIGH",
            "status": "WARNING_ISSUED",
            "description": "Water meter seal found broken"
          },
          {
            "id": "viol-uuid-2",
            "type": "EXCESS_EXTRACTION",
            "detectedOn": "2025-11-10",
            "severity": "MEDIUM",
            "status": "RESOLVED",
            "description": "Extraction 15% above permitted limit"
          }
        ],
        "lastInspection": {
          "id": "insp-uuid-1",
          "date": "2025-12-15",
          "inspector": "Ramesh Kumar",
          "findings": "Meter seal broken, recommend penalty",
          "recommendation": "IMPOSE_PENALTY"
        },
        "riskScore": 75,
        "riskCategory": "HIGH"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 23,
      "totalItems": 450,
      "itemsPerPage": 20
    },
    "summary": {
      "totalNOCs": 450,
      "compliant": 380,
      "nonCompliant": 45,
      "underWarning": 25,
      "highRisk": 15
    }
  }
}
```

### 2. Get NOC Compliance Details

```http
GET /api/officer/enforcement/nocs/{nocId}/compliance
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nocId": "noc-uuid-1",
    "nocNumber": "RJ/CGWA/NOC/2024/00123",
    "holderName": "ABC Industries Ltd",
    "complianceStatus": "NON_COMPLIANT",
    "overallScore": 65,
    "checklist": {
      "waterMeterInstalled": {
        "status": true,
        "verifiedOn": "2025-12-15",
        "notes": "Meter installed but seal broken"
      },
      "waterMeterFunctioning": {
        "status": false,
        "verifiedOn": "2025-12-15",
        "notes": "Seal tampered, readings unreliable"
      },
      "complianceReportsSubmitted": {
        "status": false,
        "lastSubmitted": "2025-09-30",
        "dueDate": "2025-12-31",
        "overdueDays": 12
      },
      "waterWithinLimits": {
        "status": true,
        "lastChecked": "2025-12-15",
        "actualExtraction": 145,
        "permittedLimit": 150,
        "compliance": "97%"
      },
      "rainwaterHarvesting": {
        "status": true,
        "verifiedOn": "2024-08-20",
        "structures": 2
      },
      "environmentalNorms": {
        "status": true,
        "verifiedOn": "2025-12-15"
      }
    },
    "inspectionHistory": [
      {
        "date": "2025-12-15",
        "inspector": "Ramesh Kumar",
        "result": "NON_COMPLIANT",
        "violationsFound": 2
      },
      {
        "date": "2025-09-10",
        "inspector": "Priya Sharma",
        "result": "COMPLIANT",
        "violationsFound": 0
      }
    ],
    "violations": [...],
    "warnings": [...],
    "penalties": [],
    "recommendations": [
      "Immediate meter seal replacement required",
      "Submit overdue quarterly compliance report",
      "Install CCTV surveillance near meter"
    ]
  }
}
```

### 3. Get Water Consumption Data

```http
GET /api/officer/enforcement/nocs/{nocId}/consumption?fromDate=2025-10-01&toDate=2026-01-12
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nocId": "noc-uuid-1",
    "nocNumber": "RJ/CGWA/NOC/2024/00123",
    "period": {
      "from": "2025-10-01",
      "to": "2026-01-12"
    },
    "dailyLimit": 150,
    "readings": [
      {
        "date": "2026-01-10",
        "reading": 52000,
        "dailyConsumption": 145,
        "percentageOfLimit": 97,
        "status": "WITHIN_LIMIT",
        "source": "AUTO_METER"
      },
      {
        "date": "2026-01-09",
        "reading": 51855,
        "dailyConsumption": 148,
        "percentageOfLimit": 99,
        "status": "WITHIN_LIMIT",
        "source": "AUTO_METER"
      }
    ],
    "summary": {
      "totalConsumption": 18250,
      "averageDaily": 146,
      "peakDay": "2025-12-20",
      "peakConsumption": 155,
      "daysExceeded": 3,
      "complianceRate": "95%"
    },
    "trends": {
      "increasing": false,
      "monthlyAverage": [142, 145, 148, 146]
    },
    "alerts": [
      {
        "date": "2025-12-20",
        "type": "LIMIT_EXCEEDED",
        "value": 155,
        "excess": 5
      }
    ]
  }
}
```

---

## Inspection Management

### 1. Schedule Inspection

```http
POST /api/officer/enforcement/inspections/schedule
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "nocId": "noc-uuid-1",
  "inspectionType": "ROUTINE" | "COMPLAINT_BASED" | "FOLLOW_UP" | "RANDOM" | "EMERGENCY",
  "scheduledDate": "2026-01-20T10:00:00Z",
  "inspectors": [
    {
      "officerId": "officer-uuid-1",
      "name": "Vikram Singh Rathore",
      "role": "LEAD_INSPECTOR"
    },
    {
      "officerId": "officer-uuid-2",
      "name": "Ramesh Kumar",
      "role": "ASSISTANT"
    }
  ],
  "purpose": "Routine quarterly compliance check and meter reading verification",
  "checklist": [
    "WATER_METER_VERIFICATION",
    "EXTRACTION_LIMIT_CHECK",
    "COMPLIANCE_DOCUMENTS",
    "SITE_CONDITION",
    "RAINWATER_HARVESTING"
  ],
  "notifyHolder": true,
  "notificationAdvanceDays": 3,
  "estimatedDuration": 120,
  "requiredEquipment": ["GPS Device", "Camera", "Measuring Tape", "Seal Kit"],
  "specialInstructions": "Check meter seal integrity and photograph",
  "relatedComplaintId": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inspectionId": "insp-uuid-3",
    "nocNumber": "RJ/CGWA/NOC/2024/00123",
    "holderName": "ABC Industries Ltd",
    "scheduledDate": "2026-01-20T10:00:00Z",
    "inspectionType": "ROUTINE",
    "leadInspector": "Vikram Singh Rathore",
    "status": "SCHEDULED",
    "notifications": {
      "holderNotified": true,
      "inspectorNotified": true,
      "notificationSentOn": "2026-01-12T14:30:00Z"
    },
    "inspectionCode": "INSP-20260120-001"
  }
}
```

### 2. Get My Scheduled Inspections

```http
GET /api/officer/enforcement/inspections/my-schedule?date=2026-01-20
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-20",
    "inspections": [
      {
        "inspectionId": "insp-uuid-3",
        "nocNumber": "RJ/CGWA/NOC/2024/00123",
        "holderName": "ABC Industries Ltd",
        "location": "Kukas, Jaipur",
        "scheduledTime": "10:00 AM",
        "estimatedDuration": "2 hours",
        "inspectionType": "ROUTINE",
        "status": "SCHEDULED",
        "priority": "MEDIUM",
        "distance": "15.5 km",
        "route": "/maps/route-to-location"
      }
    ],
    "summary": {
      "totalInspections": 3,
      "totalTravelDistance": 45.5,
      "estimatedWorkingHours": 7
    }
  }
}
```

### 3. Start Inspection (Mobile)

```http
POST /api/officer/enforcement/inspections/{inspectionId}/start
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "startTime": "2026-01-20T10:05:00Z",
  "location": {
    "latitude": 26.8467,
    "longitude": 75.7873,
    "accuracy": 10
  },
  "attendees": [
    {
      "name": "Mr. Rajesh Gupta",
      "designation": "Plant Manager",
      "contactNumber": "+91-9876543210"
    }
  ],
  "initialObservations": "Site accessible, holder cooperative"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inspectionId": "insp-uuid-3",
    "status": "IN_PROGRESS",
    "startedAt": "2026-01-20T10:05:00Z",
    "checklist": [
      {
        "item": "WATER_METER_VERIFICATION",
        "status": "PENDING",
        "mandatory": true
      },
      {
        "item": "EXTRACTION_LIMIT_CHECK",
        "status": "PENDING",
        "mandatory": true
      }
    ]
  }
}
```

### 4. Submit Inspection Report

```http
POST /api/officer/enforcement/inspections/{inspectionId}/submit-report
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
```json
{
  "inspectionDate": "2026-01-20",
  "startTime": "10:05",
  "endTime": "12:15",
  "location": {
    "latitude": 26.8467,
    "longitude": 75.7873
  },
  "holderPresent": true,
  "holderDetails": {
    "name": "Mr. Rajesh Gupta",
    "designation": "Plant Manager",
    "contactNumber": "+91-9876543210"
  },
  "findings": {
    "waterMeterInstalled": true,
    "waterMeterFunctioning": false,
    "meterReading": 52450,
    "meterSealIntact": false,
    "actualExtraction": 147,
    "permittedExtraction": 150,
    "complianceReportSubmitted": false,
    "rainwaterHarvestingPresent": true,
    "environmentalNormsFollowed": true,
    "conditionsFollowed": false
  },
  "violations": [
    {
      "type": "METER_SEAL_BROKEN",
      "severity": "HIGH",
      "description": "Water meter seal found broken and tampered",
      "evidence": ["photo1.jpg", "photo2.jpg"],
      "immediateRisk": false
    },
    {
      "type": "COMPLIANCE_REPORT_NOT_SUBMITTED",
      "severity": "MEDIUM",
      "description": "Quarterly compliance report overdue by 15 days",
      "evidence": [],
      "immediateRisk": false
    }
  ],
  "photographs": [
    "meter_front_view.jpg",
    "meter_seal_broken.jpg",
    "site_overview.jpg",
    "rwh_structure.jpg"
  ],
  "meterPhotos": ["meter_reading.jpg"],
  "observations": "Water meter seal found broken. Holder claims natural wear and tear but tampering suspected. Extraction within limits based on meter reading, but reliability questionable due to broken seal. Compliance report pending submission.",
  "recommendation": "IMPOSE_PENALTY_AND_WARNING",
  "recommendedAction": {
    "action": "PENALTY",
    "penaltyAmount": 25000,
    "reason": "Meter tampering",
    "complianceDeadline": "2026-02-05"
  },
  "correctiveActions": [
    "Replace meter seal with new tamper-proof seal",
    "Submit overdue compliance report within 7 days",
    "Install CCTV camera near water meter"
  ],
  "followUpRequired": true,
  "followUpDate": "2026-02-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inspectionId": "insp-uuid-3",
    "reportId": "report-uuid-1",
    "nocNumber": "RJ/CGWA/NOC/2024/00123",
    "inspectionDate": "2026-01-20",
    "complianceStatus": "NON_COMPLIANT",
    "violationsFound": 2,
    "actionRecommended": "IMPOSE_PENALTY_AND_WARNING",
    "reportSubmittedOn": "2026-01-20T12:30:00Z",
    "submittedBy": "Vikram Singh Rathore",
    "status": "PENDING_APPROVAL",
    "nextSteps": [
      "Report under review by Senior Enforcement Officer",
      "Penalty notice will be issued upon approval",
      "Follow-up inspection scheduled for 2026-02-15"
    ]
  }
}
```

### 5. Get Inspection Report

```http
GET /api/officer/enforcement/inspections/{inspectionId}/report
Authorization: Bearer {token}
```

### 6. Approve Inspection Report (Senior Officer)

```http
POST /api/officer/enforcement/inspections/{inspectionId}/approve
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "approvalRemarks": "Report approved. Proceed with penalty imposition as recommended.",
  "modifyRecommendation": false,
  "additionalInstructions": "Ensure meter seal replacement within 7 days"
}
```

---

## Violation Management

### 1. Get All Violations

```http
GET /api/officer/enforcement/violations?status=ACTIVE&severity=HIGH
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` - ACTIVE, WARNING_ISSUED, PENALTY_IMPOSED, RESOLVED, UNDER_REVIEW
- `severity` - LOW, MEDIUM, HIGH, CRITICAL
- `type` - Violation type
- `nocId` - Filter by NOC
- `district` - Filter by district
- `dateFrom`, `dateTo` - Date range

**Response:**
```json
{
  "success": true,
  "data": {
    "violations": [
      {
        "id": "viol-uuid-1",
        "nocId": "noc-uuid-1",
        "nocNumber": "RJ/CGWA/NOC/2024/00123",
        "holderName": "ABC Industries Ltd",
        "violationType": "METER_SEAL_BROKEN",
        "severity": "HIGH",
        "detectedOn": "2026-01-20",
        "detectedBy": "Vikram Singh Rathore",
        "detectionMethod": "FIELD_INSPECTION",
        "description": "Water meter seal found broken and tampered",
        "evidence": [
          {
            "type": "PHOTOGRAPH",
            "url": "/uploads/evidence/photo1.jpg",
            "takenOn": "2026-01-20T10:30:00Z"
          }
        ],
        "status": "WARNING_ISSUED",
        "actionTaken": {
          "type": "WARNING",
          "issuedOn": "2026-01-20",
          "complianceDeadline": "2026-02-05",
          "warningNumber": "WARN/RJ/2026/0045"
        },
        "complianceStatus": "PENDING",
        "followUpInspectionScheduled": "2026-02-15",
        "repeatOffender": false,
        "previousViolations": 1
      }
    ],
    "pagination": {...},
    "summary": {
      "totalViolations": 32,
      "active": 25,
      "resolved": 7,
      "criticalSeverity": 5,
      "highSeverity": 12
    }
  }
}
```

### 2. Get Violation Details

```http
GET /api/officer/enforcement/violations/{violationId}
Authorization: Bearer {token}
```

### 3. Update Violation Status

```http
PUT /api/officer/enforcement/violations/{violationId}/status
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "RESOLVED" | "ESCALATED" | "PENALTY_IMPOSED",
  "remarks": "Meter seal replaced and verified on 2026-02-05",
  "verificationPhotos": ["new_seal.jpg"],
  "verifiedOn": "2026-02-05",
  "closureRemarks": "Violation resolved. Holder complied within deadline."
}
```

---

## Penalty & Warning System

### 1. Issue Warning Notice

```http
POST /api/officer/enforcement/warnings/issue
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "nocId": "noc-uuid-1",
  "violationIds": ["viol-uuid-1", "viol-uuid-2"],
  "warningType": "FIRST_WARNING" | "SECOND_WARNING" | "FINAL_WARNING",
  "subject": "Warning Notice - Meter Tampering and Non-Submission of Compliance Report",
  "warningText": "You are hereby warned that during inspection conducted on 20-01-2026, following violations were found:\n\n1. Water meter seal found broken (High Severity)\n2. Quarterly compliance report not submitted (Medium Severity)\n\nYou are directed to comply with the following within 15 days from the date of this notice:\n1. Replace meter seal with new tamper-proof seal\n2. Submit overdue compliance report\n3. Install CCTV camera near water meter\n\nFailure to comply will result in imposition of penalty and may lead to NOC suspension.",
  "correctiveActions": [
    {
      "action": "Replace meter seal with tamper-proof seal",
      "deadline": "2026-02-05",
      "mandatory": true
    },
    {
      "action": "Submit overdue quarterly compliance report",
      "deadline": "2026-02-05",
      "mandatory": true
    },
    {
      "action": "Install CCTV camera near meter location",
      "deadline": "2026-02-15",
      "mandatory": false
    }
  ],
  "complianceDeadline": "2026-02-05",
  "consequencesOfNonCompliance": "Penalty of ₹50,000 will be imposed. Repeated non-compliance may lead to NOC suspension or cancellation.",
  "followUpInspection": {
    "required": true,
    "scheduledDate": "2026-02-15"
  },
  "attachments": ["inspection_report.pdf", "violation_evidence.pdf"],
  "notificationMethods": ["EMAIL", "SMS", "REGISTERED_POST", "PORTAL"],
  "issuedBy": "officer-uuid-1",
  "approvedBy": "senior-officer-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "warningId": "warn-uuid-1",
    "warningNumber": "WARN/RJ/ENF/2026/0045",
    "nocNumber": "RJ/CGWA/NOC/2024/00123",
    "holderName": "ABC Industries Ltd",
    "issuedOn": "2026-01-20",
    "complianceDeadline": "2026-02-05",
    "warningType": "FIRST_WARNING",
    "violations": 2,
    "status": "ISSUED",
    "notifications": {
      "emailSent": true,
      "smsSent": true,
      "postalDispatched": true,
      "portalNotification": true
    },
    "downloadUrl": "/api/warnings/warn-uuid-1/download",
    "trackingNumber": "POST-TRACK-123456"
  }
}
```

### 2. Issue Penalty

```http
POST /api/officer/enforcement/penalties/impose
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "nocId": "noc-uuid-1",
  "violationIds": ["viol-uuid-1"],
  "penaltyType": "METER_TAMPERING",
  "penaltyAmount": 50000,
  "calculationBasis": {
    "baseAmount": 25000,
    "violationMultiplier": 2,
    "repeatOffenderSurcharge": 0,
    "totalAmount": 50000
  },
  "penaltyReason": "Tampering with water meter seal in violation of NOC conditions. This is the second instance of such violation within 6 months.",
  "legalBasis": "Section 12(3) of Rajasthan Groundwater Act, 2024",
  "evidenceDocuments": ["inspection-report-uuid", "photos-uuid"],
  "paymentDeadline": "2026-02-20",
  "paymentInstructions": "Payment can be made online through the portal or at designated SGWA offices. Failure to pay within deadline will attract additional penalty of 10% per month.",
  "consequencesOfNonPayment": "NOC will be suspended immediately. Legal proceedings may be initiated for recovery.",
  "appealRights": {
    "canAppeal": true,
    "appealWindow": 15,
    "appealAuthority": "Member Secretary, SGWA",
    "appealProcedure": "Submit appeal application through portal within 15 days"
  },
  "issuedBy": "officer-uuid-1",
  "approvedBy": "senior-officer-uuid",
  "attachments": ["penalty-notice.pdf"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "penaltyId": "penalty-uuid-1",
    "penaltyNumber": "PEN/RJ/ENF/2026/0023",
    "nocNumber": "RJ/CGWA/NOC/2024/00123",
    "holderName": "ABC Industries Ltd",
    "penaltyAmount": 50000,
    "issuedOn": "2026-01-20",
    "paymentDeadline": "2026-02-20",
    "status": "IMPOSED",
    "paymentStatus": "PENDING",
    "paymentLink": "/payments/penalty-uuid-1",
    "downloadUrl": "/api/penalties/penalty-uuid-1/download",
    "notifications": {
      "emailSent": true,
      "smsSent": true,
      "postalDispatched": true
    }
  }
}
```

### 3. Track Penalty Payment

```http
GET /api/officer/enforcement/penalties/{penaltyId}/payment-status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "penaltyId": "penalty-uuid-1",
    "penaltyNumber": "PEN/RJ/ENF/2026/0023",
    "amount": 50000,
    "paymentStatus": "PAID" | "PENDING" | "PARTIAL" | "OVERDUE",
    "paidAmount": 50000,
    "paymentDate": "2026-02-15",
    "transactionId": "TXN20260215123456",
    "paymentMethod": "ONLINE",
    "receiptNumber": "REC/2026/0234",
    "receiptUrl": "/api/receipts/rec-uuid-1/download"
  }
}
```

### 4. Get All Warnings

```http
GET /api/officer/enforcement/warnings?status=ACTIVE
Authorization: Bearer {token}
```

### 5. Get All Penalties

```http
GET /api/officer/enforcement/penalties?paymentStatus=PENDING
Authorization: Bearer {token}
```

---

## Complaint Management

### 1. Register Public Complaint

```http
POST /api/officer/enforcement/complaints/register
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "complaintType": "UNAUTHORIZED_EXTRACTION" | "METER_TAMPERING" | "EXCESS_EXTRACTION" | "NO_NOC" | "OTHER",
  "category": "PUBLIC_COMPLAINT",
  "source": "PHONE" | "EMAIL" | "WALK_IN" | "ONLINE_PORTAL" | "SOCIAL_MEDIA",
  "complaintDetails": {
    "subject": "Illegal borewell operation without NOC",
    "description": "Construction site operating borewell for last 3 months without any NOC. Extracting large quantities daily. Located near residential area causing water table depletion.",
    "evidenceProvided": true,
    "evidenceTypes": ["PHOTOGRAPHS", "VIDEO"]
  },
  "location": {
    "district": "Jaipur",
    "block": "Sanganer",
    "village": "Sitapura",
    "address": "Plot 123, Industrial Area Phase-2, Sitapura",
    "landmark": "Near ABC School",
    "coordinates": {
      "latitude": 26.8234,
      "longitude": 75.7912
    }
  },
  "suspectedEntity": {
    "name": "XYZ Construction Company",
    "type": "COMPANY",
    "activityType": "Construction",
    "estimatedWaterExtraction": "High - multiple borewells"
  },
  "complainant": {
    "type": "KNOWN" | "ANONYMOUS",
    "name": "Rajesh Sharma",
    "contactNumber": "+91-9876543210",
    "email": "rajesh.sharma@email.com",
    "address": "House 45, Sitapura Colony",
    "wantConfidentiality": true
  },
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "requestedAction": "Immediate inspection and action",
  "attachments": ["complaint_photos.zip", "video_evidence.mp4"],
  "registeredBy": "officer-uuid-1",
  "assignTo": "officer-uuid-2"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "complaintId": "comp-uuid-1",
    "complaintNumber": "COMP/RJ/ENF/2026/0156",
    "registeredOn": "2026-01-20T14:30:00Z",
    "complaintType": "UNAUTHORIZED_EXTRACTION",
    "location": "Sitapura, Jaipur",
    "urgency": "HIGH",
    "status": "REGISTERED",
    "assignedTo": {
      "officerId": "officer-uuid-2",
      "name": "Ramesh Kumar",
      "designation": "Field Officer"
    },
    "targetDate": "2026-01-25",
    "trackingUrl": "/complaints/comp-uuid-1/track",
    "acknowledgementSent": true
  }
}
```

### 2. Get All Complaints

```http
GET /api/officer/enforcement/complaints?status=INVESTIGATING&assignedTo=me
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` - REGISTERED, ASSIGNED, INVESTIGATING, RESOLVED, DISMISSED, CLOSED
- `urgency` - HIGH, MEDIUM, LOW
- `type` - Complaint type
- `district` - Filter by district
- `assignedTo` - me, officer-id, unassigned
- `dateFrom`, `dateTo` - Date range

**Response:**
```json
{
  "success": true,
  "data": {
    "complaints": [
      {
        "complaintId": "comp-uuid-1",
        "complaintNumber": "COMP/RJ/ENF/2026/0156",
        "type": "UNAUTHORIZED_EXTRACTION",
        "subject": "Illegal borewell operation",
        "location": "Sitapura, Jaipur",
        "registeredOn": "2026-01-20",
        "urgency": "HIGH",
        "status": "INVESTIGATING",
        "assignedTo": "Ramesh Kumar",
        "daysOpen": 3,
        "lastAction": "Site inspection conducted on 2026-01-22",
        "complainantType": "KNOWN"
      }
    ],
    "pagination": {...},
    "summary": {
      "total": 45,
      "urgent": 8,
      "investigating": 15,
      "resolved": 25
    }
  }
}
```

### 3. View Complaint Details

```http
GET /api/officer/enforcement/complaints/{complaintId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "complaint": {
      "complaintId": "comp-uuid-1",
      "complaintNumber": "COMP/RJ/ENF/2026/0156",
      // All complaint details
      "timeline": [
        {
          "date": "2026-01-20T14:30:00Z",
          "action": "REGISTERED",
          "actor": "Vikram Singh",
          "remarks": "Complaint registered based on phone call"
        },
        {
          "date": "2026-01-20T15:00:00Z",
          "action": "ASSIGNED",
          "actor": "System",
          "assignedTo": "Ramesh Kumar"
        },
        {
          "date": "2026-01-22T11:00:00Z",
          "action": "INSPECTION_CONDUCTED",
          "actor": "Ramesh Kumar",
          "remarks": "Site inspection completed. Unauthorized extraction confirmed."
        }
      ],
      "inspections": [...],
      "actions": [...]
    }
  }
}
```

### 4. Update Complaint Status

```http
PUT /api/officer/enforcement/complaints/{complaintId}/status
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "RESOLVED" | "DISMISSED" | "INVESTIGATING" | "ACTION_TAKEN",
  "actionTaken": "Site inspection conducted on 22-01-2026. Unauthorized borewell confirmed. Show cause notice issued. Entity directed to obtain NOC or cease operations within 15 days.",
  "remarks": "Complaint verified and resolved. Notice issued to violator.",
  "attachments": ["inspection_report.pdf", "notice_copy.pdf"],
  "closureCategory": "ACTION_TAKEN" | "NO_VIOLATION_FOUND" | "UNABLE_TO_VERIFY",
  "notifyComplainant": true
}
```

### 5. Assign Complaint

```http
POST /api/officer/enforcement/complaints/{complaintId}/assign
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "assignTo": "officer-uuid-2",
  "priority": "HIGH",
  "targetDate": "2026-01-25",
  "instructions": "Conduct site inspection immediately and verify complaint"
}
```

---

## NOC Cancellation

### 1. Initiate NOC Suspension

```http
POST /api/officer/enforcement/nocs/{nocId}/suspend
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "suspensionReason": "REPEATED_VIOLATIONS",
  "violations": ["viol-uuid-1", "viol-uuid-2", "viol-uuid-3"],
  "penalties": ["penalty-uuid-1"],
  "description": "NOC holder has repeatedly violated conditions despite warnings and penalties. Three violations detected in last 6 months including meter tampering, excess extraction, and non-submission of compliance reports.",
  "legalBasis": "Section 15(2) of Rajasthan Groundwater Act, 2024",
  "showCauseNoticeRequired": true,
  "showCauseNoticePeriod": 15,
  "hearingRequired": true,
  "evidenceDocuments": ["inspection-reports", "warning-notices", "penalty-notices"],
  "recommendedBy": "officer-uuid-1",
  "approvalRequired": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suspensionId": "susp-uuid-1",
    "nocNumber": "RJ/CGWA/NOC/2024/00123",
    "status": "SHOW_CAUSE_ISSUED",
    "showCauseNoticeNumber": "SCN/RJ/ENF/2026/0012",
    "issuedOn": "2026-01-20",
    "responseDeadline": "2026-02-05",
    "hearingScheduled": false,
    "hearingDate": null,
    "nextStep": "Awaiting holder response to show cause notice"
  }
}
```

### 2. Initiate NOC Cancellation

```http
POST /api/officer/enforcement/nocs/{nocId}/initiate-cancellation
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "cancellationReason": "FRAUDULENT_INFORMATION" | "REPEATED_VIOLATIONS" | "CHANGED_CONDITIONS" | "HOLDER_REQUEST",
  "primaryGrounds": "Severe and repeated violations with no compliance",
  "detailedJustification": "NOC holder has consistently violated conditions despite multiple warnings and penalties. Continued operation poses risk to groundwater sustainability in the area.",
  "violations": [...],
  "warnings": [...],
  "penalties": [...],
  "complianceHistory": {
    "warningsIssued": 3,
    "penaltiesImposed": 2,
    "complianceRate": "35%",
    "overallScore": 25
  },
  "legalBasis": "Section 16 of Rajasthan Groundwater Act, 2024",
  "showCauseNoticeDate": "2026-01-25",
  "hearingDate": "2026-02-10",
  "hearingVenue": "SGWA Office, Jaipur",
  "recommendingOfficer": "officer-uuid-1",
  "approvalAuthority": "Member Secretary, SGWA",
  "supportingDocuments": [...]
}
```

### 3. Schedule Hearing

```http
POST /api/officer/enforcement/nocs/{nocId}/schedule-hearing
Authorization: Bearer {token}
```

### 4. Record Hearing Proceedings

```http
POST /api/officer/enforcement/hearings/{hearingId}/record-proceedings
Authorization: Bearer {token}
```

### 5. Issue Final Cancellation Order

```http
POST /api/officer/enforcement/nocs/{nocId}/cancel
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "cancellationOrderNumber": "CANCEL/RJ/2026/0005",
  "effectiveDate": "2026-02-20",
  "cancellationReasons": [...],
  "hearingConclusions": "Based on evidence and hearing, holder found guilty of repeated violations",
  "finalRemarks": "NOC cancelled with immediate effect",
  "appealRights": {
    "canAppeal": true,
    "appealPeriod": 30,
    "appealAuthority": "High Court, Rajasthan"
  },
  "consequencesForHolder": [
    "Stop all groundwater extraction immediately",
    "No new NOC applications for 2 years",
    "Seal existing borewells"
  ],
  "fieldActions": {
    "borewellSealing": true,
    "meterRemoval": true,
    "siteInspection": true
  }
}
```

---

## Field Operations

### 1. Mobile Check-in

```http
POST /api/officer/enforcement/field/checkin
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "location": {
    "latitude": 26.8467,
    "longitude": 75.7873,
    "accuracy": 10
  },
  "timestamp": "2026-01-20T10:00:00Z",
  "activity": "SITE_INSPECTION",
  "relatedTo": "insp-uuid-3"
}
```

### 2. Upload Field Photo

```http
POST /api/officer/enforcement/field/upload-photo
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `photo` - Image file
- `relatedTo` - inspection-id or complaint-id
- `photoType` - METER_READING, VIOLATION_EVIDENCE, SITE_CONDITION, etc.
- `location` - GPS coordinates
- `timestamp` - Photo timestamp
- `notes` - Optional notes

### 3. Record GPS Track

```http
POST /api/officer/enforcement/field/gps-track
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "date": "2026-01-20",
  "trackPoints": [
    {
      "latitude": 26.8467,
      "longitude": 75.7873,
      "timestamp": "2026-01-20T10:00:00Z",
      "accuracy": 10
    }
  ],
  "totalDistance": 45.5,
  "duration": 420
}
```

### 4. Get Nearby NOCs (Mobile)

```http
GET /api/officer/enforcement/field/nearby-nocs?lat=26.8467&lng=75.7873&radius=5
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nocs": [
      {
        "nocId": "noc-uuid-1",
        "nocNumber": "RJ/CGWA/NOC/2024/00123",
        "holderName": "ABC Industries",
        "distance": 1.2,
        "direction": "NE",
        "lastInspected": "2025-12-15",
        "complianceStatus": "NON_COMPLIANT",
        "coordinates": {...}
      }
    ]
  }
}
```

---

## Reports & Analytics

### 1. Generate Enforcement Report

```http
POST /api/officer/enforcement/reports/generate
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "reportType": "INSPECTION_SUMMARY" | "VIOLATION_ANALYSIS" | "PENALTY_RECOVERY" | "COMPLIANCE_STATUS",
  "period": {
    "from": "2026-01-01",
    "to": "2026-01-31"
  },
  "filters": {
    "districts": ["Jaipur", "Dausa"],
    "officers": ["officer-uuid-1"],
    "violationTypes": ["METER_TAMPERING"],
    "includeResolved": true
  },
  "format": "PDF" | "EXCEL",
  "includeCharts": true,
  "includePhotos": true
}
```

**Available Report Types:**
- `INSPECTION_SUMMARY` - Monthly inspection summary
- `VIOLATION_ANALYSIS` - Violation trends and analysis
- `PENALTY_RECOVERY` - Penalty imposition and recovery
- `COMPLIANCE_STATUS` - Overall compliance status
- `OFFICER_PERFORMANCE` - Officer-wise performance
- `DISTRICT_WISE` - District-wise breakdown
- `COMPLAINT_RESOLUTION` - Complaint handling statistics

### 2. Get Analytics Dashboard

```http
GET /api/officer/enforcement/analytics?period=monthly
Authorization: Bearer {token}
```

### 3. Export Violation Data

```http
GET /api/officer/enforcement/export/violations?format=excel&fromDate=2026-01-01
Authorization: Bearer {token}
```

---

## Real-time Monitoring

### 1. Get Live Water Extraction Data

```http
GET /api/officer/enforcement/monitoring/live-data?nocId=noc-uuid-1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nocId": "noc-uuid-1",
    "nocNumber": "RJ/CGWA/NOC/2024/00123",
    "realTimeData": {
      "currentExtraction": 145.5,
      "dailyLimit": 150,
      "percentageUsed": 97,
      "lastUpdated": "2026-01-20T12:00:00Z",
      "meterStatus": "ONLINE",
      "dataSource": "AUTOMATED_METER"
    },
    "alerts": [
      {
        "type": "APPROACHING_LIMIT",
        "message": "Extraction at 97% of daily limit",
        "severity": "MEDIUM"
      }
    ],
    "trend": {
      "last24Hours": [142, 145, 148, 145],
      "status": "NORMAL"
    }
  }
}
```

### 2. Set Alert Threshold

```http
POST /api/officer/enforcement/monitoring/set-alert
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "nocId": "noc-uuid-1",
  "alertType": "EXTRACTION_LIMIT",
  "threshold": 95,
  "notificationMethods": ["SMS", "EMAIL", "PUSH"]
}
```

---

## Workflows & Use Cases

### Complete Inspection Workflow

```
1. Schedule Inspection
   POST /inspections/schedule

2. Start Inspection (Mobile)
   POST /inspections/{id}/start

3. Conduct Inspection
   - Upload photos
   - Record findings
   - Check compliance

4. Submit Report
   POST /inspections/{id}/submit-report

5. If Violations Found:
   a. Issue Warning
      POST /warnings/issue
   OR
   b. Issue Penalty
      POST /penalties/impose

6. Schedule Follow-up
   POST /inspections/schedule
```

---

## Testing Guide

### PowerShell - Complete Workflow

```powershell
# 1. Login as Enforcement Officer
$loginBody = @{
    username = "enforcement.officer@sgwa.gov.in"
    password = "Enforce@2026"
    userType = "ENFORCEMENT"
    captcha = "5A7K9"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $loginBody

$token = $loginResponse.data.token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Logged in as: $($loginResponse.data.user.name)"

# 2. Get Dashboard
$dashboard = Invoke-RestMethod -Uri "http://localhost:3000/api/officer/enforcement/dashboard" `
    -Method GET `
    -Headers $headers

Write-Host "Active NOCs: $($dashboard.data.stats.activeNOCs)"
Write-Host "Violations Detected: $($dashboard.data.stats.violationsDetected)"

# 3. Get Non-Compliant NOCs
$nonCompliant = Invoke-RestMethod -Uri "http://localhost:3000/api/officer/enforcement/active-nocs?complianceStatus=NON_COMPLIANT&limit=10" `
    -Method GET `
    -Headers $headers

$firstNOC = $nonCompliant.data.nocs[0]
Write-Host "First Non-Compliant NOC: $($firstNOC.nocNumber)"

# 4. Schedule Inspection
$inspectionBody = @{
    nocId = $firstNOC.nocId
    inspectionType = "FOLLOW_UP"
    scheduledDate = "2026-01-25T10:00:00Z"
    inspectors = @(
        @{
            officerId = $loginResponse.data.user.id
            name = $loginResponse.data.user.name
            role = "LEAD_INSPECTOR"
        }
    )
    purpose = "Follow-up inspection for meter tampering violation"
    checklist = @("WATER_METER_VERIFICATION", "SEAL_INTEGRITY")
    notifyHolder = $true
} | ConvertTo-Json -Depth 5

$inspection = Invoke-RestMethod -Uri "http://localhost:3000/api/officer/enforcement/inspections/schedule" `
    -Method POST `
    -Headers $headers `
    -Body $inspectionBody

Write-Host "Inspection Scheduled: $($inspection.data.inspectionCode)"

# 5. Issue Warning
$warningBody = @{
    nocId = $firstNOC.nocId
    violationIds = @($firstNOC.violations[0].id)
    warningType = "FIRST_WARNING"
    subject = "Warning for Meter Tampering"
    warningText = "Meter seal found broken during inspection. Immediate replacement required."
    correctiveActions = @(
        @{
            action = "Replace meter seal"
            deadline = "2026-02-05"
            mandatory = $true
        }
    )
    complianceDeadline = "2026-02-05"
    consequencesOfNonCompliance = "Penalty of ₹50,000 will be imposed"
} | ConvertTo-Json -Depth 5

$warning = Invoke-RestMethod -Uri "http://localhost:3000/api/officer/enforcement/warnings/issue" `
    -Method POST `
    -Headers $headers `
    -Body $warningBody

Write-Host "Warning Issued: $($warning.data.warningNumber)"

# 6. Generate Monthly Report
$reportBody = @{
    reportType = "INSPECTION_SUMMARY"
    period = @{
        from = "2026-01-01"
        to = "2026-01-31"
    }
    format = "PDF"
} | ConvertTo-Json

$report = Invoke-RestMethod -Uri "http://localhost:3000/api/officer/enforcement/reports/generate" `
    -Method POST `
    -Headers $headers `
    -Body $reportBody

Write-Host "Report Generated: $($report.data.downloadUrl)"
```

---

## Error Codes Reference

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOC_NOT_FOUND` | 404 | NOC not found |
| `INSPECTION_ALREADY_COMPLETED` | 409 | Inspection already done |
| `INVALID_VIOLATION_TYPE` | 400 | Invalid violation type |
| `PENALTY_ALREADY_IMPOSED` | 409 | Penalty already imposed |
| `CANCELLATION_IN_PROGRESS` | 409 | Cancellation already initiated |

---

## Mobile App Features

- ✅ Offline inspection support
- ✅ GPS tracking
- ✅ Photo capture with geotag
- ✅ Voice notes
- ✅ Barcode/QR scan
- ✅ Route optimization
- ✅ Push notifications

---

## Security & Compliance

1. **Field Data Integrity**: GPS verification, timestamp validation
2. **Photo Authentication**: EXIF data validation, watermarking
3. **Evidence Chain**: Complete audit trail
4. **Role-Based Access**: Strict permission enforcement
5. **Data Encryption**: End-to-end encryption for sensitive data

---

**Version:** 1.0  
**Last Updated:** 2026-01-12  
**Maintained by:** Enforcement Wing - SGWA  
**Support:** enforcement-tech@sgwa.rajasthan.gov.in
