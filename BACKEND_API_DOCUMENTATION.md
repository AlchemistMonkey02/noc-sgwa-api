# SGWA Backend API Documentation
## State Ground Water Authority - API Specification

> **Version:** 1.0  
> **Last Updated:** January 2026  
> **Base URL:** `https://api.sgwa.rajasthan.gov.in/v1`

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [User Management](#2-user-management)
3. [NOC Applications](#3-noc-applications)
4. [Rig Management](#4-rig-management)
5. [Application Tracking](#5-application-tracking)
6. [Calculators & Tools](#6-calculators--tools)
7. [Master Data](#7-master-data)
8. [Document Management](#8-document-management)
9. [Officer Portal](#9-officer-portal)
10. [Public Portal](#10-public-portal)
11. [Compliance & Monitoring](#11-compliance--monitoring)
12. [Common Response Formats](#12-common-response-formats)

---

## 1. Authentication & Authorization

### 1.1 User Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and return JWT token

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "userType": "APPLICANT | DGO | RSGWA | ENFORCEMENT",
  "captcha": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "string",
    "username": "string",
    "email": "string",
    "userType": "APPLICANT",
    "fullName": "string",
    "phone": "string",
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600,
    "permissions": ["string"]
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account locked or inactive
- `400 Bad Request` - Invalid captcha or missing fields

---

### 1.2 User Registration

**Endpoint:** `POST /auth/register`

**Description:** Register new applicant user

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "password": "string",
  "confirmPassword": "string",
  "organizationName": "string",
  "organizationType": "INDIVIDUAL | COMPANY | GOVERNMENT | NGO",
  "panNumber": "string",
  "gstNumber": "string (optional)",
  "address": {
    "line1": "string",
    "line2": "string",
    "city": "string",
    "state": "string",
    "pincode": "string"
  },
  "captcha": "string"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "userId": "string",
    "email": "string",
    "message": "Registration successful. Please verify your email."
  }
}
```

---

### 1.3 Refresh Token

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "expiresIn": 3600
  }
}
```

---

### 1.4 Logout

**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.5 Forgot Password

**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "string",
  "captcha": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

---

### 1.6 Reset Password

**Endpoint:** `POST /auth/reset-password`

**Request Body:**
```json
{
  "token": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

---

## 2. User Management

### 2.1 Get User Profile

**Endpoint:** `GET /users/profile`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "organizationName": "string",
    "organizationType": "string",
    "panNumber": "string",
    "gstNumber": "string",
    "address": {
      "line1": "string",
      "line2": "string",
      "city": "string",
      "state": "string",
      "pincode": "string"
    },
    "verificationStatus": "PENDING | VERIFIED | REJECTED",
    "accountStatus": "ACTIVE | INACTIVE | SUSPENDED",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
  }
}
```

---

### 2.2 Update User Profile

**Endpoint:** `PUT /users/profile`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "organizationName": "string",
  "address": {
    "line1": "string",
    "line2": "string",
    "city": "string",
    "state": "string",
    "pincode": "string"
  }
}
```

---

## 3. NOC Applications

### 3.1 Create NOC Application

**Endpoint:** `POST /applications/noc`

**Headers:** `Authorization: Bearer {token}`

**Description:** Submit new NOC application for groundwater extraction

**Request Body:**
```json
{
  "applicationType": "Fresh Application | NOC Renewal | NOC Amendment | NOC Transfer",
  "applicationSubType": "Permanent | Temporary (Upto 3 Years)",
  "projectType": "New | Expansion | Renovation",
  "waterQualityType": "Fresh Water | Saline Water | Brackish Water",
  "groundWaterUtilizationFor": "Industry | Mining | Domestic | Infrastructure | Irrigation | Commercial | Other Projects",
  "industryType": "string (if Industry selected)",
  "miningType": "string (if Mining selected)",
  "otherProjectType": "string (if Other Projects selected)",
  "dateOfCommencement": "2026-01-01",
  "existingNOCStatus": "Yes | No",
  "oldNOCNo": "string (if existing NOC)",
  "isMSME": "Yes | No",
  "msmeType": "Micro | Small | Medium",
  "msmeRegistrationNumber": "string (if MSME)",
  
  "projectDetails": {
    "projectName": "string",
    "state": "Rajasthan",
    "district": "string",
    "block": "string",
    "tehsil": "string",
    "assessmentUnit": "string",
    "village": "string",
    "khasraNo": "string",
    "pincode": "string",
    "latitude": "number",
    "longitude": "number",
    "areaType": "Industrial | Agricultural | Residential | Commercial | Defense | Mining Area",
    "projectArea": "number (in acres)",
    "builtUpArea": "number (in sq.m)"
  },
  
  "waterRequirement": {
    "dailyWaterRequirement": "number (in m³/day)",
    "annualWaterRequirement": "number (in m³/year)",
    "peakDemand": "number (in m³/day)",
    "sourceOfWater": "Groundwater | Surface Water | Both",
    "surfaceWaterSource": "string (if applicable)",
    "proposedDepth": "number (in meters)",
    "numberOfWells": "number",
    "proposedDiameter": "number (in mm)"
  },
  
  "applicantDetails": {
    "name": "string",
    "designation": "string",
    "mobileNo": "string",
    "email": "string",
    "panNo": "string",
    "gstNo": "string (optional)",
    "companyName": "string",
    "companyAddress": "string"
  },
  
  "geologicalDetails": {
    "typeOfGeology": "Hard Rock | Alluvial | Coastal | Semi-Consolidated",
    "soilType": "string",
    "rockFormation": "string"
  },
  
  "existingStructures": [
    {
      "type": "Tubewell | Borewell | Dug Well | Open Well",
      "yearOfConstruction": "number",
      "depth": "number (meters)",
      "diameter": "number (mm)",
      "depthToWaterLevel": "number (meters)",
      "discharge": "number (m³/hour)",
      "hasMeter": "Yes | No",
      "meterNumber": "string (if has meter)"
    }
  ],
  
  "complianceRequirements": {
    "isPollutingIndustry": "boolean",
    "requiresPiezometer": "boolean",
    "requiresFlowMeter": "boolean",
    "rainwaterHarvestingPlan": "boolean",
    "wastewaterTreatmentPlan": "boolean"
  },
  
  "blockCategory": {
    "category": "SAFE | SEMI_CRITICAL | CRITICAL | OVER_EXPLOITED",
    "validityYears": "number"
  },
  
  "exemptionStatus": {
    "isExempt": "boolean",
    "exemptionType": "MSME_SMALL | MSME_MICRO | DOMESTIC_SMALL | etc.",
    "exemptionCode": "string"
  },
  
  "documents": {
    "applicationForm": "document_id",
    "identityProof": "document_id",
    "addressProof": "document_id",
    "landOwnershipProof": "document_id",
    "siteMap": "document_id",
    "projectReport": "document_id",
    "mseCertificate": "document_id (if MSME)",
    "noCopy": "document_id (if renewal)",
    "environmentalClearance": "document_id (if required)",
    "otherDocuments": ["document_id"]
  },
  
  "paymentDetails": {
    "applicationFee": "number",
    "gstAmount": "number",
    "totalAmount": "number",
    "paymentMethod": "Online | Offline",
    "transactionId": "string",
    "paymentReceiptNumber": "string",
    "paymentDate": "2026-01-01"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "applicationId": "NOC2026001234",
    "applicationNumber": "RJ/CGWA/NOC/2026/001234",
    "status": "SUBMITTED",
    "submittedDate": "2026-01-01T10:30:00Z",
    "estimatedProcessingDays": 60,
    "trackingUrl": "/applications/noc/NOC2026001234",
    "acknowledgementUrl": "/applications/noc/NOC2026001234/acknowledgement"
  },
  "message": "Application submitted successfully"
}
```

---

### 3.2 Get NOC Application Details

**Endpoint:** `GET /applications/noc/{applicationId}`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applicationId": "string",
    "applicationNumber": "string",
    "status": "SUBMITTED | UNDER_REVIEW | QUERY_RAISED | APPROVED | REJECTED | WITHDRAWN",
    "submittedDate": "2026-01-01T00:00:00Z",
    "lastUpdated": "2026-01-01T00:00:00Z",
    "applicationType": "string",
    "projectName": "string",
    "location": "string",
    "currentStage": "string",
    "assignedOfficer": {
      "name": "string",
      "designation": "string",
      "email": "string"
    },
    "timeline": [
      {
        "stage": "SUBMITTED",
        "date": "2026-01-01T00:00:00Z",
        "remarks": "string",
        "officer": "string"
      }
    ],
    "queries": [
      {
        "queryId": "string",
        "raisedBy": "string",
        "raisedDate": "2026-01-01T00:00:00Z",
        "query": "string",
        "response": "string",
        "responseDate": "2026-01-01T00:00:00Z",
        "status": "PENDING | ANSWERED"
      }
    ],
    "documents": [],
    "applicationData": {}
  }
}
```

---

### 3.3 Get User Applications List

**Endpoint:** `GET /applications/noc`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `status` (optional): Filter by status
- `type` (optional): Filter by application type
- `page` (default: 1)
- `limit` (default: 10)
- `sortBy` (default: submittedDate)
- `order` (default: desc)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "applicationId": "string",
        "applicationNumber": "string",
        "projectName": "string",
        "applicationType": "string",
        "status": "string",
        "submittedDate": "2026-01-01T00:00:00Z",
        "location": "string",
        "currentStage": "string"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalRecords": 95,
      "limit": 10
    }
  }
}
```

---

### 3.4 Update NOC Application

**Endpoint:** `PUT /applications/noc/{applicationId}`

**Headers:** `Authorization: Bearer {token}`

**Description:** Update application (only allowed in DRAFT or QUERY_RAISED status)

**Request Body:** Same as Create NOC Application

---

### 3.5 Withdraw NOC Application

**Endpoint:** `POST /applications/noc/{applicationId}/withdraw`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "reason": "string"
}
```

---

### 3.6 Respond to Query

**Endpoint:** `POST /applications/noc/{applicationId}/queries/{queryId}/respond`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "response": "string",
  "documents": ["document_id"]
}
```

---

## 4. Rig Management

### 4.1 Register Rig NOC Application

**Endpoint:** `POST /applications/rig-noc`

**Headers:** `Authorization: Bearer {token}`

**Description:** Register rig and apply for NOC for well construction

**Request Body:**
```json
{
  "applicantCategory": "Drilling Agency | Individual | Organization",
  "applicationType": "New Registration | Renewal | Amendment",
  
  "rigDetails": {
    "rigRegistrationNo": "string (if existing)",
    "rigType": "DTH Rig | Rotary Rig | Cable Tool Rig | Percussion Rig | etc.",
    "rigMountingType": "Truck Mounted | Trailer Mounted | Skid Mounted",
    "rigCapacity": "string",
    "manufacturerName": "string",
    "manufacturingYear": "number",
    "engineDetails": "string",
    "engineHP": "number"
  },
  
  "operatorDetails": {
    "operatorName": "string",
    "licenseNumber": "string",
    "experience": "number (years)",
    "contactNumber": "string"
  },
  
  "wellDetails": {
    "state": "string",
    "district": "string",
    "block": "string",
    "village": "string",
    "khasraNo": "string",
    "latitude": "number",
    "longitude": "number",
    "proposedDepth": "number",
    "proposedDiameter": "number",
    "purposeOfDrilling": "string"
  },
  
  "landOwnerDetails": {
    "ownerName": "string",
    "contact": "string",
    "consentLetterDocId": "string"
  },
  
  "documents": {
    "rigPhotos": ["document_id"],
    "insuranceCertificate": "document_id",
    "operatorLicense": "document_id",
    "pollutionCertificate": "document_id",
    "safetyCertificate": "document_id",
    "landConsentLetter": "document_id"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "applicationId": "RIG2026001234",
    "rigRegistrationNo": "RJ/RIG/2026/001234",
    "status": "SUBMITTED",
    "submittedDate": "2026-01-01T10:30:00Z"
  }
}
```

---

### 4.2 Register Rig Operation Permit

**Endpoint:** `POST /applications/rig-operation`

**Headers:** `Authorization: Bearer {token}`

**Description:** Apply for rig operation permit for specific location and duration

**Request Body:**
```json
{
  "rigRegistrationNo": "string",
  "operationType": "Drilling | Maintenance | Repair | Decommissioning",
  "operationPurposes": ["Irrigation", "Domestic", "Industrial"],
  "operationDuration": "1 Month | 3 Months | 6 Months | 1 Year",
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  
  "operationLocation": {
    "state": "string",
    "district": "string",
    "block": "string",
    "villages": ["string"],
    "areaDescription": "string"
  },
  
  "estimatedWells": "number",
  "targetDepthRange": "string",
  
  "safetyMeasures": {
    "safetyEquipment": ["string"],
    "emergencyContactName": "string",
    "emergencyContactNumber": "string"
  },
  
  "documents": {
    "operationPlan": "document_id",
    "safetyPlan": "document_id",
    "insuranceProof": "document_id"
  }
}
```

---

### 4.3 Search Rig Registry

**Endpoint:** `GET /rigs/search`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `registrationNo` (optional)
- `rigType` (optional)
- `status` (optional): ACTIVE, EXPIRED, SUSPENDED
- `page` (default: 1)
- `limit` (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "rigs": [
      {
        "rigId": "string",
        "registrationNo": "string",
        "rigType": "string",
        "ownerName": "string",
        "status": "ACTIVE | EXPIRED | SUSPENDED",
        "validUpto": "2026-12-31",
        "lastInspectionDate": "2026-01-01"
      }
    ],
    "pagination": {}
  }
}
```

---

### 4.4 Get Rig Details

**Endpoint:** `GET /rigs/{rigId}`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "rigId": "string",
    "registrationNo": "string",
    "rigType": "string",
    "rigMountingType": "string",
    "manufacturerName": "string",
    "manufacturingYear": "number",
    "ownerDetails": {},
    "operatorDetails": {},
    "certifications": [],
    "operationHistory": [],
    "status": "string",
    "validFrom": "2026-01-01",
    "validUpto": "2026-12-31"
  }
}
```

---

## 5. Application Tracking

### 5.1 Track Application Status

**Endpoint:** `GET /applications/track/{applicationId}`

**Description:** Public endpoint to track application status (no auth required)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applicationId": "string",
    "applicationNumber": "string",
    "applicationType": "string",
    "status": "string",
    "currentStage": "string",
    "submittedDate": "2026-01-01T00:00:00Z",
    "lastUpdated": "2026-01-01T00:00:00Z",
    "estimatedCompletionDate": "2026-03-01",
    "statusHistory": [
      {
        "status": "SUBMITTED",
        "date": "2026-01-01T00:00:00Z",
        "remarks": "Application received"
      },
      {
        "status": "UNDER_REVIEW",
        "date": "2026-01-05T00:00:00Z",
        "remarks": "Application under technical review"
      }
    ],
    "nextAction": "Awaiting field inspection",
    "contactOfficer": {
      "name": "string",
      "designation": "string",
      "email": "string",
      "phone": "string"
    }
  }
}
```

---

## 6. Calculators & Tools

### 6.1 EC Calculator

**Endpoint:** `POST /tools/ec-calculator`

**Description:** Calculate Environmental Compensation Charges

**Request Body:**
```json
{
  "waterExtraction": "number (in m³/day)",
  "duration": "number (in days)",
  "delayInRenewal": "number (days)",
  "blockCategory": "SAFE | SEMI_CRITICAL | CRITICAL | OVER_EXPLOITED",
  "industryType": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "baseCharge": "number",
    "multiplierFactor": "number",
    "penaltyCharge": "number",
    "totalEC": "number",
    "breakup": {
      "extractionCharge": "number",
      "categoryPremium": "number",
      "delayPenalty": "number"
    },
    "calculation": "string (formula explanation)"
  }
}
```

---

### 6.2 Abstraction Charges Calculator

**Endpoint:** `POST /tools/abstraction-charges`

**Request Body:**
```json
{
  "annualExtraction": "number (in m³/year)",
  "waterQuality": "Fresh Water | Saline Water | Brackish Water",
  "purpose": "Industrial | Commercial | Irrigation | etc.",
  "blockCategory": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "baseRate": "number (per m³)",
    "totalCharge": "number",
    "gst": "number",
    "grandTotal": "number",
    "validityPeriod": "string",
    "paymentSchedule": "Quarterly | Annually"
  }
}
```

---

### 6.3 Water Budget Calculator

**Endpoint:** `POST /tools/water-budget`

**Request Body:**
```json
{
  "district": "string",
  "block": "string",
  "proposedExtraction": "number (m³/year)",
  "projectType": "string",
  "areaType": "string",
  "waterQuality": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "blockCategory": "string",
    "availableResource": "number (HAM)",
    "currentUtilization": "number (HAM)",
    "proposedExtraction": "number (HAM)",
    "balanceAfterAllocation": "number (HAM)",
    "utilizationPercentage": "number",
    "recommendation": "APPROVE | APPROVE_WITH_CONDITIONS | REJECT",
    "nocValidity": "3 Years | 5 Years | 10 Years",
    "conditions": ["string"],
    "areaTypeMultiplier": "number",
    "waterQualityMultiplier": "number"
  }
}
```

---

## 7. Master Data

### 7.1 Get States List

**Endpoint:** `GET /master/states`

**Response (200 OK):**
```json
{
  "success": true,
  "data": ["Rajasthan"]
}
```

---

### 7.2 Get Districts List

**Endpoint:** `GET /master/districts`

**Query Parameters:**
- `state`: State name (required for filtered list)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "districtId": "string",
      "districtName": "Jaipur",
      "state": "Rajasthan"
    }
  ]
}
```

---

### 7.3 Get Blocks List

**Endpoint:** `GET /master/blocks`

**Query Parameters:**
- `district`: District name (required)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "blockId": "string",
      "blockName": "Amer",
      "district": "Jaipur",
      "category": "SAFE",
      "categoryCode": "SAFE",
      "description": "string",
      "validityYears": 10,
      "restrictions": ["string"]
    }
  ]
}
```

---

### 7.4 Get Block Category

**Endpoint:** `GET /master/blocks/{districtName}/{blockName}/category`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "district": "Jaipur",
    "block": "Amer",
    "category": "SAFE",
    "code": "SAFE",
    "name": "Safe",
    "color": "#28a745",
    "description": "Groundwater development is below 70% of available resource",
    "validityYears": 10,
    "restrictions": [],
    "allowedIndustries": ["All"],
    "bannedIndustries": []
  }
}
```

---

### 7.5 Get Industry Types

**Endpoint:** `GET /master/industry-types`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "value": "textile_manufacturing",
      "label": "Textile Manufacturing",
      "category": "Manufacturing",
      "isPolluting": true,
      "isPackagedWater": false,
      "exemptionEligible": false
    }
  ]
}
```

---

### 7.6 Get Document Requirements

**Endpoint:** `GET /master/documents/requirements`

**Query Parameters:**
- `applicationType`: NOC | RIG_NOC | RIG_OPERATION
- `projectType`: Industry | Mining | etc.
- `isMSME`: true | false

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "mandatory": [
      {
        "documentType": "APPLICATION_FORM",
        "documentName": "NOC Application Form",
        "description": "Duly filled and signed application form",
        "maxSize": "5MB",
        "allowedFormats": ["PDF"],
        "sampleUrl": "/samples/application-form.pdf"
      }
    ],
    "conditional": [
      {
        "documentType": "MSME_CERTIFICATE",
        "documentName": "MSME Certificate",
        "description": "Valid MSME/Udyam registration certificate",
        "condition": "Required if applicant is MSME",
        "maxSize": "2MB",
        "allowedFormats": ["PDF", "JPG"]
      }
    ],
    "optional": []
  }
}
```

---

### 7.7 Get Fee Structure

**Endpoint:** `GET /master/fees`

**Query Parameters:**
- `applicationType`
- `projectType`
- `waterExtraction` (m³/day)
- `isMSME`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applicationFee": 5000,
    "processingFee": 2000,
    "inspectionFee": 1000,
    "gst": 1440,
    "totalFee": 9440,
    "exemptions": [],
    "paymentModes": ["Online", "DD", "Challan"]
  }
}
```

---

## 8. Document Management

### 8.1 Upload Document

**Endpoint:** `POST /documents/upload`

**Headers:** 
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Request Body (Form Data):**
- `file`: File (max 5MB)
- `documentType`: string
- `applicationId`: string (optional)
- `description`: string (optional)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "documentId": "DOC2026001234",
    "fileName": "noc_application.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf",
    "uploadDate": "2026-01-01T10:30:00Z",
    "downloadUrl": "/documents/DOC2026001234/download",
    "viewUrl": "/documents/DOC2026001234/view"
  }
}
```

---

### 8.2 Download Document

**Endpoint:** `GET /documents/{documentId}/download`

**Headers:** `Authorization: Bearer {token}`

**Response:** File stream

---

### 8.3 View Document

**Endpoint:** `GET /documents/{documentId}/view`

**Headers:** `Authorization: Bearer {token}`

**Response:** Document preview (PDF viewer, image viewer)

---

### 8.4 Delete Document

**Endpoint:** `DELETE /documents/{documentId}`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## 9. Officer Portal

### 9.1 Get Assigned Applications

**Endpoint:** `GET /officer/applications`

**Headers:** `Authorization: Bearer {token}`

**Description:** Get list of applications assigned to officer

**Query Parameters:**
- `status`
- `priority`
- `assignedDate`
- `page`
- `limit`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "applicationId": "string",
        "applicationNumber": "string",
        "applicantName": "string",
        "projectName": "string",
        "applicationType": "string",
        "status": "string",
        "priority": "HIGH | MEDIUM | LOW",
        "daysInQueue": "number",
        "dueDate": "2026-01-01",
        "location": "string"
      }
    ],
    "statistics": {
      "total": 50,
      "pending": 30,
      "underReview": 15,
      "queriesRaised": 5,
      "overdue": 8
    },
    "pagination": {}
  }
}
```

---

### 9.2 Review Application

**Endpoint:** `POST /officer/applications/{applicationId}/review`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "action": "APPROVE | REJECT | RAISE_QUERY | REQUEST_INSPECTION",
  "remarks": "string",
  "conditions": ["string"],
  "queries": [
    {
      "category": "TECHNICAL | DOCUMENT | COMPLIANCE",
      "question": "string",
      "requiredDocuments": ["string"]
    }
  ],
  "inspectionDetails": {
    "inspectionDate": "2026-01-10",
    "inspectorId": "string",
    "purpose": "string"
  },
  "nocDetails": {
    "nocNumber": "string",
    "validFrom": "2026-01-01",
    "validUpto": "2029-01-01",
    "approvedWaterExtraction": "number",
    "conditions": ["string"],
    "restrictions": ["string"]
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applicationId": "string",
    "newStatus": "string",
    "processedBy": "string",
    "processedDate": "2026-01-01T00:00:00Z"
  }
}
```

---

### 9.3 Assign Application

**Endpoint:** `POST /officer/applications/{applicationId}/assign`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "assignToOfficerId": "string",
  "priority": "HIGH | MEDIUM | LOW",
  "remarks": "string"
}
```

---

### 9.4 Schedule Inspection

**Endpoint:** `POST /officer/inspections`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "applicationId": "string",
  "inspectionDate": "2026-01-10",
  "inspectorId": "string",
  "inspectionType": "FIELD | DESK | JOINT",
  "purpose": "string",
  "checklistItems": ["string"]
}
```

---

### 9.5 Submit Inspection Report

**Endpoint:** `POST /officer/inspections/{inspectionId}/report`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "inspectionDate": "2026-01-10",
  "findings": "string",
  "checklistResults": [
    {
      "item": "string",
      "status": "COMPLIANT | NON_COMPLIANT | PARTIAL",
      "remarks": "string"
    }
  ],
  "photographs": ["document_id"],
  "recommendation": "APPROVE | REJECT | CONDITIONAL_APPROVAL",
  "remarks": "string"
}
```

---

### 9.6 Generate NOC Certificate

**Endpoint:** `POST /officer/applications/{applicationId}/generate-noc`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "nocNumber": "string",
  "validFrom": "2026-01-01",
  "validUpto": "2029-01-01",
  "approvedWaterExtraction": "number",
  "numberOfWells": "number",
  "depth": "number",
  "diameter": "number",
  "conditions": ["string"],
  "restrictions": ["string"],
  "complianceRequirements": {
    "flowMeter": true,
    "piezometer": true,
    "rainwaterHarvesting": true,
    "quarterlyReports": true
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "nocId": "string",
    "nocNumber": "string",
    "certificateUrl": "/noc/{nocId}/certificate.pdf",
    "issueDate": "2026-01-01T00:00:00Z",
    "qrCode": "base64_qr_code"
  }
}
```

---

## 10. Public Portal

### 10.1 Get Registered Drilling Agencies

**Endpoint:** `GET /public/agencies`

**Description:** Public list of registered drilling agencies

**Query Parameters:**
- `district` (optional)
- `rigType` (optional)
- `search` (optional)
- `page`
- `limit`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "agencies": [
      {
        "agencyId": "string",
        "agencyName": "string",
        "registrationNo": "string",
        "contactPerson": "string",
        "phone": "string",
        "email": "string",
        "address": "string",
        "operatingDistricts": ["string"],
        "rigTypes": ["string"],
        "registrationDate": "2026-01-01",
        "validUpto": "2029-01-01",
        "status": "ACTIVE | EXPIRED"
      }
    ],
    "pagination": {}
  }
}
```

---

### 10.2 Get NOC Statistics

**Endpoint:** `GET /public/statistics`

**Description:** Public statistics dashboard

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalApplications": 1234,
    "approvedApplications": 890,
    "pendingApplications": 234,
    "rejectedApplications": 110,
    "averageProcessingDays": 45,
    "districtWiseStats": [
      {
        "district": "Jaipur",
        "total": 234,
        "approved": 180,
        "pending": 40,
        "rejected": 14
      }
    ],
    "categoryWiseStats": {
      "safe": 456,
      "semiCritical": 345,
      "critical": 234,
      "overExploited": 199
    }
  }
}
```

---

### 10.3 Verify NOC

**Endpoint:** `GET /public/verify-noc/{nocNumber}`

**Description:** Verify authenticity of NOC certificate

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "nocNumber": "string",
    "holderName": "string",
    "projectName": "string",
    "location": "string",
    "issueDate": "2026-01-01",
    "validUpto": "2029-01-01",
    "status": "ACTIVE | EXPIRED | CANCELLED",
    "approvedExtraction": "number (m³/day)",
    "conditions": ["string"]
  }
}
```

---

## 11. Compliance & Monitoring

### 11.1 Submit Compliance Report

**Endpoint:** `POST /compliance/reports`

**Headers:** `Authorization: Bearer {token}`

**Description:** Submit quarterly/annual compliance report

**Request Body:**
```json
{
  "nocId": "string",
  "reportingPeriod": {
    "from": "2026-01-01",
    "to": "2026-03-31"
  },
  "reportType": "QUARTERLY | ANNUAL",
  
  "waterExtraction": {
    "totalExtraction": "number (m³)",
    "monthlyBreakup": [
      {
        "month": "January",
        "extraction": "number"
      }
    ],
    "peakExtraction": "number"
  },
  
  "meterReadings": [
    {
      "wellId": "string",
      "meterId": "string",
      "openingReading": "number",
      "closingReading": "number",
      "totalExtraction": "number",
      "calibrationDate": "2026-01-01"
    }
  ],
  
  "waterQuality": {
    "samplingDate": "2026-01-01",
    "laboratoryName": "string",
    "parameters": {
      "ph": "number",
      "tds": "number",
      "ec": "number",
      "fluoride": "number",
      "nitrate": "number"
    },
    "reportDocument": "document_id"
  },
  
  "rainwaterHarvesting": {
    "structuresInstalled": "number",
    "estimatedRecharge": "number",
    "maintenanceDate": "2026-01-01",
    "photographs": ["document_id"]
  },
  
  "piezometerData": {
    "staticWaterLevel": "number (meters)",
    "dynamicWaterLevel": "number (meters)",
    "readings": [
      {
        "date": "2026-01-01",
        "depth": "number"
      }
    ]
  },
  
  "documents": {
    "meterReadingSheet": "document_id",
    "waterQualityReport": "document_id",
    "photographs": ["document_id"]
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "reportId": "string",
    "submittedDate": "2026-01-01T00:00:00Z",
    "status": "SUBMITTED",
    "acknowledgementNumber": "string"
  }
}
```

---

### 11.2 Get Compliance Dashboard

**Endpoint:** `GET /compliance/dashboard`

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "activeNOCs": [
      {
        "nocId": "string",
        "nocNumber": "string",
        "projectName": "string",
        "nextReportDue": "2026-04-30",
        "complianceStatus": "COMPLIANT | OVERDUE | PARTIAL",
        "overdueReports": 0
      }
    ],
    "upcomingDeadlines": [
      {
        "nocId": "string",
        "reportType": "QUARTERLY",
        "dueDate": "2026-04-30",
        "daysRemaining": 15
      }
    ],
    "recentReports": []
  }
}
```

---

### 11.3 Get Compliance Report History

**Endpoint:** `GET /compliance/reports`

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `nocId` (optional)
- `reportType` (optional)
- `status` (optional)
- `page`
- `limit`

---

## 12. Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {},
    "timestamp": "2026-01-01T00:00:00Z"
  }
}
```

### HTTP Status Codes
- `200 OK` - Successful GET/PUT/PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate entry
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service down

### Common Error Codes
- `INVALID_INPUT` - Invalid request parameters
- `AUTHENTICATION_FAILED` - Login failed
- `UNAUTHORIZED_ACCESS` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `DUPLICATE_ENTRY` - Resource already exists
- `VALIDATION_ERROR` - Input validation failed
- `FILE_TOO_LARGE` - File size exceeds limit
- `INVALID_FILE_TYPE` - Unsupported file format
- `QUOTA_EXCEEDED` - Rate limit or quota exceeded
- `SERVER_ERROR` - Internal server error

---

## Additional Information

### Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer {jwt_token}
```

### Rate Limiting
- Public APIs: 100 requests/hour
- Authenticated APIs: 1000 requests/hour
- File uploads: 20 uploads/hour

### Pagination
Standard pagination format for list endpoints:
```
?page=1&limit=10&sortBy=createdAt&order=desc
```

### File Upload Limits
- Maximum file size: 5MB
- Allowed formats: PDF, JPG, JPEG, PNG
- Multiple files: Maximum 10 files per request

### Date Formats
- ISO 8601 format: `2026-01-01T00:00:00Z`
- Date only: `2026-01-01`

### Support
- Email: support@sgwa.rajasthan.gov.in
- Phone: +91-141-XXXXXXX
- Portal: https://sgwa.rajasthan.gov.in

---

**End of Documentation**
