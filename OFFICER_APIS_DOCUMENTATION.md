
---

## Officer APIs - DGO (District Groundwater Officer)

### 9.1 Get Assigned Applications (DGO Dashboard)

**Endpoint:** `GET /officer/dgo/applications`

**Headers:**
```
Authorization: Bearer {token}
Role: DGO
```

**Query Parameters:**
```
?status=PENDING_VERIFICATION&district=Jaipur&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "applicationId": "NOC2026001234",
        "applicationNumber": "RJ/CGWA/NOC/2026/001234",
        "applicantName": "Rajesh Kumar Sharma",
        "projectName": "ABC Textile Manufacturing Unit",
        "projectType": "Industrial",
        "district": "Jaipur",
        "block": "Sanganer",
        "waterRequirement": "150.25 m³/day",
        "submittedDate": "2026-01-09T08:00:00Z",
        "status": "PENDING_VERIFICATION",
        "daysInQueue": 2,
        "priority": "NORMAL",
        "documentsUploaded": 10,
        "documentsRequired": 10
      }
    ],
    "statistics": {
      "total": 45,
      "pendingVerification": 15,
      "underReview": 20,
      "queriesRaised": 5,
      "completed": 5
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalRecords": 45,
      "limit": 20
    }
  }
}
```

---

### 9.2 Get Application Details (DGO View)

**Endpoint:** `GET /officer/dgo/applications/{applicationId}`

**Headers:**
```
Authorization: Bearer {token}
Role: DGO
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applicationDetails": {
      "applicationId": "NOC2026001234",
      "applicationNumber": "RJ/CGWA/NOC/2026/001234",
      "status": "PENDING_VERIFICATION",
      "submittedDate": "2026-01-09T08:00:00Z",
      "assignedDate": "2026-01-09T09:00:00Z",
      "applicantInfo": {
        "name": "Rajesh Kumar Sharma",
        "email": "rajesh.sharma@example.com",
        "mobile": "9876543210",
        "organizationName": "ABC Industries Pvt Ltd"
      },
      "projectDetails": {
        "projectName": "ABC Textile Manufacturing Unit",
        "location": "Sanganer, Jaipur, Rajasthan",
        "projectType": "Industrial",
        "waterRequirement": "150.25 m³/day"
      },
      "documents": [
        {
          "documentId": "DOC001234",
          "documentType": "land_ownership",
          "documentName": "Land Ownership Certificate",
          "fileName": "Land_Ownership_Certificate.pdf",
          "uploadedAt": "2026-01-09T07:45:00Z",
          "verificationStatus": "PENDING",
          "remarks": null
        }
      ],
      "paymentDetails": {
        "status": "PAID",
        "amount": 21600,
        "transactionId": "TXN2026001234",
        "receiptNumber": "RCP/2026/001234"
      },
      "actionHistory": [
        {
          "action": "APPLICATION_SUBMITTED",
          "timestamp": "2026-01-09T08:00:00Z",
          "officer": "Applicant",
          "remarks": "Application submitted"
        }
      ]
    }
  }
}
```

---

### 9.3 Verify Documents

**Endpoint:** `POST /officer/dgo/applications/{applicationId}/verify-documents`

**Headers:**
```
Authorization: Bearer {token}
Role: DGO
```

**Request Body:**
```json
{
  "documents": [
    {
      "documentId": "DOC001234",
      "status": "APPROVED",
      "remarks": "Document verified - valid land ownership certificate"
    },
    {
      "documentId": "DOC001235",
      "status": "REJECTED",
      "remarks": "Site map does not show GPS coordinates clearly. Please re-upload with proper coordinates."
    }
  ],
  "overallStatus": "DOCUMENTS_VERIFIED",
  "officerRemarks": "All statutory documents verified. Site map needs correction."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Document verification completed",
  "data": {
    "applicationId": "NOC2026001234",
    "verificationStatus": "DOCUMENTS_VERIFIED",
    "documentVerificationDate": "2026-01-10T10:30:00Z",
    "nextStep": "TECHNICAL_REVIEW",
    "rejectedDocuments": 1
  }
}
```

---

### 9.4 Raise Query to Applicant

**Endpoint:** `POST /officer/dgo/applications/{applicationId}/raise-query`

**Headers:**
```
Authorization: Bearer {token}
Role: DGO
```

**Request Body:**
```json
{
  "queryType": "DOCUMENT_CLARIFICATION",
  "subject": "Clarification Required - Site Map",
  "query": "The submitted site map does not clearly show the GPS coordinates of proposed borewells. Please upload an updated site map with clearly marked coordinates in decimal degrees format.",
  "documentsRequired": ["site_map"],
  "priority": "HIGH",
  "responseDeadline": "2026-01-15T23:59:59Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Query raised successfully",
  "data": {
    "queryId": "QRY001234",
    "applicationId": "NOC2026001234",
    "status": "QUERY_RAISED",
    "raisedDate": "2026-01-10T11:00:00Z",
    "responseDeadline": "2026-01-15T23:59:59Z",
    "emailSent": true,
    "smsSent": true
  }
}
```

---

### 9.5 Schedule Site Inspection

**Endpoint:** `POST /officer/dgo/applications/{applicationId}/schedule-inspection`

**Headers:**
```
Authorization: Bearer {token}
Role: DGO
```

**Request Body:**
```json
{
  "inspectionDate": "2026-01-15T10:00:00Z",
  "inspectionType": "SITE_VISIT",
  "inspectorName": "Inspector Suresh Kumar",
  "inspectorContact": "9876543211",
  "purpose": "Verify land ownership, check existing wells, assess groundwater availability",
  "notifyApplicant": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Site inspection scheduled",
  "data": {
    "inspectionId": "INS001234",
    "applicationId": "NOC2026001234",
    "scheduledDate": "2026-01-15T10:00:00Z",
    "inspector": "Inspector Suresh Kumar",
    "applicantNotified": true
  }
}
```

---

### 9.6 Submit Inspection Report

**Endpoint:** `POST /officer/dgo/applications/{applicationId}/inspection-report`

**Headers:**
```
Authorization: Bearer {token}
Role: DGO
```

**Request Body:**
```json
{
  "inspectionId": "INS001234",
  "inspectionDate": "2026-01-15T10:00:00Z",
  "inspector": "Inspector Suresh Kumar",
  "findings": {
    "landOwnershipVerified": true,
    "existingWellsVerified": true,
    "existingWellsCount": 1,
    "proposedLocationSuitable": true,
    "distanceFromNearestWell": "250 meters",
    "waterTableDepth": "45 meters",
    "soilType": "Alluvial",
    "rainwaterHarvestingStructures": true
  },
  "recommendations": "Site is suitable for proposed groundwater extraction. Recommend approval subject to SGWA technical review.",
  "inspectionStatus": "COMPLETED",
  "reportDocument": "DOC001260"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Inspection report submitted",
  "data": {
    "inspectionId": "INS001234",
    "applicationId": "NOC2026001234",
    "status": "INSPECTION_COMPLETED",
    "nextStep": "FORWARD_TO_SGWA",
    "submittedDate": "2026-01-15T15:30:00Z"
  }
}
```

---

### 9.7 Forward Application to SGWA

**Endpoint:** `POST /officer/dgo/applications/{applicationId}/forward-to-sgwa`

**Headers:**
```
Authorization: Bearer {token}
Role: DGO
```

**Request Body:**
```json
{
  "dgoRecommendation": "RECOMMEND_APPROVAL",
  "remarks": "Documents verified, site inspection completed. Site is suitable for groundwater extraction. Recommend approval subject to SGWA technical review and compliance conditions.",
  "attachments": ["DOC001260"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Application forwarded to SGWA",
  "data": {
    "applicationId": "NOC2026001234",
    "status": "PENDING_SGWA_REVIEW",
    "forwardedDate": "2026-01-16T10:00:00Z",
    "assignedTo": "SGWA Technical Team"
  }
}
```

---

## Officer APIs - SGWA (State Groundwater Authority)

### 10.1 Get Applications Pending SGWA Review

**Endpoint:** `GET /officer/sgwa/applications`

**Headers:**
```
Authorization: Bearer {token}
Role: SGWA
```

**Query Parameters:**
```
?status=PENDING_SGWA_REVIEW&blockCategory=SEMI_CRITICAL&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "applicationId": "NOC2026001234",
        "applicationNumber": "RJ/CGWA/NOC/2026/001234",
        "applicantName": "Rajesh Kumar Sharma",
        "projectName": "ABC Textile Manufacturing Unit",
        "district": "Jaipur",
        "block": "Sanganer",
        "blockCategory": "SEMI_CRITICAL",
        "waterRequirement": "150.25 m³/day",
        "submittedDate": "2026-01-09T08:00:00Z",
        "dgoForwardedDate": "2026-01-16T10:00:00Z",
        "dgoRecommendation": "RECOMMEND_APPROVAL",
        "status": "PENDING_SGWA_REVIEW",
        "daysInQueue": 1
      }
    ],
    "statistics": {
      "total": 30,
      "pendingReview": 12,
      "underTechnicalReview": 10,
      "recommendedForApproval": 5,
      "recommendedForRejection": 3
    }
  }
}
```

---

### 10.2 Conduct Technical Review

**Endpoint:** `POST /officer/sgwa/applications/{applicationId}/technical-review`

**Headers:**
```
Authorization: Bearer {token}
Role: SGWA
```

**Request Body:**
```json
{
  "reviewType": "COMPREHENSIVE",
  "technicalParameters": {
    "waterAvailability": "ADEQUATE",
    "aquiferType": "ALLUVIAL",
    "rechargeRate": "GOOD",
    "waterQuality": "POTABLE",
    "sustainabilityAssessment": "SUSTAINABLE",
    "environmentalImpact": "LOW"
  },
  "blockAnalysis": {
    "currentExtractionLevel": "75%",
    "categoryVerified": "SEMI_CRITICAL",
    "additionalExtractionAllowable": true,
    "conditions": [
      "Rainwater harvesting mandatory",
      "Digital flow meter installation required",
      "Piezometer installation required",
      "Quarterly monitoring reports mandatory"
    ]
  },
  "waterBudgetAnalysis": {
    "proposedExtraction": 150.25,
    "existingExtraction": 2500,
    "totalAllowable": 3000,
    "impactAssessment": "MINIMAL_IMPACT"
  },
  "sgwaRecommendation": "RECOMMEND_APPROVAL_WITH_CONDITIONS",
  "proposedValidityYears": 3,
  "conditions": [
    "Install digital flow meter with telemetry within 30 days",
    "Install piezometer at specified location",
    "Submit quarterly groundwater monitoring reports",
    "Implement rainwater harvesting as per approved plan",
    "No withdrawal during monsoon season (July-September)"
  ],
  "remarks": "Technical parameters are satisfactory. Block is semi-critical, additional extraction allowable with strict monitoring conditions."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Technical review completed",
  "data": {
    "applicationId": "NOC2026001234",
    "reviewStatus": "TECHNICAL_REVIEW_COMPLETED",
    "recommendation": "RECOMMEND_APPROVAL_WITH_CONDITIONS",
    "validityYears": 3,
    "conditionsCount": 5,
    "nextStep": "FORWARD_TO_ENFORCEMENT",
    "reviewDate": "2026-01-18T14:30:00Z"
  }
}
```

---

### 10.3 Calculate Groundwater Cess

**Endpoint:** `POST /officer/sgwa/applications/{applicationId}/calculate-cess`

**Headers:**
```
Authorization: Bearer {token}
Role: SGWA
```

**Request Body:**
```json
{
  "annualExtraction": 54841.25,
  "blockCategory": "SEMI_CRITICAL",
  "industryType": "Textile Manufacturing",
  "cessRate": 50
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cessCalculation": {
      "annualExtraction": 54841.25,
      "cessRatePerM3": 50,
      "annualCess": 2742062.50,
      "gst": 493571.25,
      "totalAnnualCess": 3235633.75,
      "paymentFrequency": "QUARTERLY",
      "quarterlyAmount": 808908.44
    }
  }
}
```

---

### 10.4 Forward to Enforcement Wing

**Endpoint:** `POST /officer/sgwa/applications/{applicationId}/forward-to-enforcement`

**Headers:**
```
Authorization: Bearer {token}
Role: SGWA
```

**Request Body:**
```json
{
  "sgwaRecommendation": "RECOMMEND_APPROVAL_WITH_CONDITIONS",
  "technicalReviewSummary": "Technical parameters satisfactory. Block category verified as Semi-Critical. Additional extraction allowable with monitoring conditions.",
  "proposedValidityYears": 3,
  "cessAmount": 3235633.75,
  "conditions": [
    "Install digital flow meter with telemetry within 30 days",
    "Install piezometer at specified location",
    "Submit quarterly groundwater monitoring reports",
    "Implement rainwater harvesting as per approved plan",
    "No withdrawal during monsoon season (July-September)"
  ],
  "attachments": ["DOC001270"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Application forwarded to Enforcement Wing for final approval",
  "data": {
    "applicationId": "NOC2026001234",
    "status": "PENDING_FINAL_APPROVAL",
    "forwardedDate": "2026-01-20T11:00:00Z",
    "assignedTo": "Enforcement Wing"
  }
}
```

---

## Officer APIs - Enforcement Wing

### 11.1 Get Applications for Final Approval

**Endpoint:** `GET /officer/enforcement/applications`

**Headers:**
```
Authorization: Bearer {token}
Role: ENFORCEMENT
```

**Query Parameters:**
```
?status=PENDING_FINAL_APPROVAL&recommendation=RECOMMEND_APPROVAL&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "applicationId": "NOC2026001234",
        "applicationNumber": "RJ/CGWA/NOC/2026/001234",
        "applicantName": "Rajesh Kumar Sharma",
        "projectName": "ABC Textile Manufacturing Unit",
        "district": "Jaipur",
        "waterRequirement": "150.25 m³/day",
        "dgoRecommendation": "RECOMMEND_APPROVAL",
        "sgwaRecommendation": "RECOMMEND_APPROVAL_WITH_CONDITIONS",
        "proposedValidityYears": 3,
        "conditionsCount": 5,
        "submittedDate": "2026-01-09T08:00:00Z",
        "sgwaForwardedDate": "2026-01-20T11:00:00Z",
        "status": "PENDING_FINAL_APPROVAL",
        "daysInQueue": 1
      }
    ],
    "statistics": {
      "total": 20,
      "pendingFinalApproval": 8,
      "approved": 10,
      "rejected": 2
    }
  }
}
```

---

### 11.2 Review Complete Application

**Endpoint:** `GET /officer/enforcement/applications/{applicationId}/complete-review`

**Headers:**
```
Authorization: Bearer {token}
Role: ENFORCEMENT
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applicationSummary": {
      "applicationId": "NOC2026001234",
      "applicationNumber": "RJ/CGWA/NOC/2026/001234",
      "applicantDetails": {},
      "projectDetails": {},
      "waterRequirement": {},
      "dgoVerification": {
        "status": "VERIFIED",
        "recommendation": "RECOMMEND_APPROVAL",
        "siteInspectionCompleted": true,
        "documentsVerified": true
      },
      "sgwaTechnicalReview": {
        "status": "APPROVED_WITH_CONDITIONS",
        "recommendation": "RECOMMEND_APPROVAL_WITH_CONDITIONS",
        "waterAvailability": "ADEQUATE",
        "blockCategory": "SEMI_CRITICAL",
        "sustainabilityAssessment": "SUSTAINABLE",
        "proposedValidityYears": 3,
        "cessAmount": 3235633.75
      },
      "conditions": [
        "Install digital flow meter with telemetry within 30 days",
        "Install piezometer at specified location",
        "Submit quarterly groundwater monitoring reports"
      ],
      "timeline": {
        "submitted": "2026-01-09T08:00:00Z",
        "dgoVerified": "2026-01-16T10:00:00Z",
        "sgwaReviewed": "2026-01-20T11:00:00Z",
        "totalDays": 11
      }
    }
  }
}
```

---

### 11.3 Approve NOC Application

**Endpoint:** `POST /officer/enforcement/applications/{applicationId}/approve`

**Headers:**
```
Authorization: Bearer {token}
Role: ENFORCEMENT
```

**Request Body:**
```json
{
  "approvalType": "CONDITIONAL_APPROVAL",
  "nocNumber": "RJ/CGWA/NOC/2026/001234",
  "validityYears": 3,
  "validFrom": "2026-01-22",
  "validUpto": "2029-01-21",
  "maxDailyExtraction": 150.25,
  "maxAnnualExtraction": 54841.25,
  "conditions": [
    "Install digital flow meter with telemetry within 30 days of NOC issuance",
    "Install piezometer at GPS coordinates 26.8206°N, 75.8472°E within 60 days",
    "Submit quarterly groundwater monitoring reports by 15th of following month",
    "Implement rainwater harvesting structures as per approved plan within 90 days",
    "No groundwater withdrawal during monsoon season (July-September)",
    "Pay groundwater cess quarterly as per SGWA notification"
  ],
  "specialConditions": [
    "NOC is valid only for the specified location and project",
    "Any change in project scope requires fresh NOC",
    "Violation of conditions will lead to NOC cancellation"
  ],
  "cessDetails": {
    "annualCess": 3235633.75,
    "paymentFrequency": "QUARTERLY",
    "quarterlyAmount": 808908.44
  },
  "approvalRemarks": "NOC approved subject to compliance with all stated conditions",
  "approvedBy": "Chief Engineer, SGWA",
  "signatureDocument": "DOC001280"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "NOC application approved successfully",
  "data": {
    "applicationId": "NOC2026001234",
    "nocNumber": "RJ/CGWA/NOC/2026/001234",
    "status": "APPROVED",
    "approvalDate": "2026-01-22T10:00:00Z",
    "validFrom": "2026-01-22",
    "validUpto": "2029-01-21",
    "nocCertificateUrl": "https://cdn.sgwa.raj.in/noc/RJ_CGWA_NOC_2026_001234.pdf",
    "digitallySigned": true,
    "qrCode": "https://verify.sgwa.raj.in/noc/NOC2026001234",
    "applicantNotified": true,
    "emailSent": true,
    "smsSent": true
  }
}
```

---

### 11.4 Reject NOC Application

**Endpoint:** `POST /officer/enforcement/applications/{applicationId}/reject`

**Headers:**
```
Authorization: Bearer {token}
Role: ENFORCEMENT
```

**Request Body:**
```json
{
  "rejectionReason": "TECHNICAL_GROUNDS",
  "detailedReasons": [
    "Project location falls in Over-Exploited block",
    "Proposed extraction exceeds block allocation limits",
    "Inadequate rainwater harvesting measures"
  ],
  "rejectionRemarks": "Application rejected on technical grounds. The proposed project location (Block: Sanganer) has been re-categorized as Over-Exploited as per latest CGWA notification No. XYZ/2026. No new groundwater extraction permits can be issued in this block.",
  "appealInformation": {
    "canAppeal": true,
    "appealDeadline": "2026-02-22T23:59:59Z",
    "appealAuthority": "Appellate Authority, CGWA",
    "appealProcedure": "Submit appeal with revised proposal addressing rejection grounds"
  },
  "rejectedBy": "Chief Engineer, SGWA",
  "signatureDocument": "DOC001285"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "NOC application rejected",
  "data": {
    "applicationId": "NOC2026001234",
    "status": "REJECTED",
    "rejectionDate": "2026-01-22T10:00:00Z",
    "rejectionReason": "TECHNICAL_GROUNDS",
    "rejectionLetterUrl": "https://cdn.sgwa.raj.in/rejections/NOC2026001234_Rejection.pdf",
    "canAppeal": true,
    "appealDeadline": "2026-02-22T23:59:59Z",
    "applicantNotified": true
  }
}
```

---

### 11.5 Issue NOC Certificate

**Endpoint:** `POST /officer/enforcement/applications/{applicationId}/issue-certificate`

**Headers:**
```
Authorization: Bearer {token}
Role: ENFORCEMENT
```

**Request Body:**
```json
{
  "certificateType": "NOC_CERTIFICATE",
  "includeQRCode": true,
  "digitalSignature": true,
  "watermark": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "NOC certificate issued",
  "data": {
    "certificateId": "CERT001234",
    "nocNumber": "RJ/CGWA/NOC/2026/001234",
    "issueDate": "2026-01-22T10:30:00Z",
    "certificateUrl": "https://cdn.sgwa.raj.in/certificates/NOC_CERT_001234.pdf",
    "qrCodeUrl": "https://verify.sgwa.raj.in/noc/NOC2026001234",
    "digitallySigned": true,
    "signatoryName": "Chief Engineer, SGWA",
    "signatoryDesignation": "Chief Engineer"
  }
}
```

---

### 11.6 Generate Compliance Schedule

**Endpoint:** `POST /officer/enforcement/applications/{applicationId}/compliance-schedule`

**Headers:**
```
Authorization: Bearer {token}
Role: ENFORCEMENT
```

**Request Body:**
```json
{
  "complianceItems": [
    {
      "item": "Install Digital Flow Meter",
      "deadline": "2026-02-22",
      "frequency": "ONE_TIME",
      "mandatory": true
    },
    {
      "item": "Submit Quarterly Monitoring Report",
      "deadline": "2026-04-15",
      "frequency": "QUARTERLY",
      "mandatory": true
    },
    {
      "item": "Pay Groundwater Cess",
      "deadline": "2026-04-10",
      "frequency": "QUARTERLY",
      "mandatory": true,
      "amount": 808908.44
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Compliance schedule generated",
  "data": {
    "scheduleId": "SCH001234",
    "applicationId": "NOC2026001234",
    "totalItems": 3,
    "scheduleUrl": "https://cdn.sgwa.raj.in/schedules/SCH_001234.pdf",
    "reminderScheduled": true
  }
}
```

---
