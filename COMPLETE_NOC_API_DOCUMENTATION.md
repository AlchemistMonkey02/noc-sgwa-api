# Complete NOC Backend API Documentation

**Version:** 1.0  
**Base URL:** `http://api.sgwa.rajasthan.gov.in/api/v1`  
**Authentication:** Bearer Token (JWT)

---

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [User Management APIs](#user-management-apis)
3. [NOC Application APIs](#noc-application-apis)
4. [Document Upload APIs](#document-upload-apis)
5. [Payment APIs](#payment-apis)
6. [Dashboard APIs](#dashboard-apis)
7. [Master Data APIs](#master-data-apis)
8. [Application Tracking APIs](#application-tracking-apis)
9. [Officer APIs - DGO (District Groundwater Officer)](#officer-apis---dgo)
10. [Officer APIs - SGWA (State Groundwater Authority)](#officer-apis---sgwa)
11. [Officer APIs - Enforcement Wing](#officer-apis---enforcement-wing)

---

## Authentication APIs

### 1.1 User Registration

**Endpoint:** `POST /auth/register`

**Description:** Register a new user account for NOC application

**Request Body:**
```json
{
  "applicantName": "Rajesh Kumar Sharma",
  "email": "rajesh.sharma@example.com",
  "mobile": "9876543210",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123",
  "aadhaarNumber": "123456789012",
  "panNumber": "ABCDE1234F",
  "organizationName": "ABC Industries Pvt Ltd",
  "organizationType": "Private Limited Company",
  "designation": "Managing Director",
  "agreeTerm": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "userId": "USR001234",
    "email": "rajesh.sharma@example.com",
    "emailVerificationSent": true,
    "mobileVerificationSent": true
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "email": "Email already registered",
    "mobile": "Mobile number already exists",
    "aadhaarNumber": "Invalid Aadhaar number format"
  }
}
```

---

### 1.2 Email Verification

**Endpoint:** `POST /auth/verify-email`

**Request Body:**
```json
{
  "email": "rajesh.sharma@example.com",
  "verificationCode": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "emailVerified": true
  }
}
```

---

### 1.3 User Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "rajesh.sharma@example.com",
  "password": "SecurePass@123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "USR001234",
    "name": "Rajesh Kumar Sharma",
    "email": "rajesh.sharma@example.com",
    "role": "APPLICANT",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

### 1.4 Logout

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 1.5 Refresh Token

**Endpoint:** `POST /auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

### 1.6 Forgot Password

**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "rajesh.sharma@example.com"
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

### 1.7 Reset Password

**Endpoint:** `POST /auth/reset-password`

**Request Body:**
```json
{
  "email": "rajesh.sharma@example.com",
  "resetToken": "abc123xyz789",
  "newPassword": "NewSecurePass@123",
  "confirmPassword": "NewSecurePass@123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## User Management APIs

### 2.1 Get User Profile

**Endpoint:** `GET /users/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "USR001234",
    "applicantName": "Rajesh Kumar Sharma",
    "email": "rajesh.sharma@example.com",
    "mobile": "9876543210",
    "aadhaarNumber": "123456789012",
    "panNumber": "ABCDE1234F",
    "organizationName": "ABC Industries Pvt Ltd",
    "organizationType": "Private Limited Company",
    "designation": "Managing Director",
    "emailVerified": true,
    "mobileVerified": true,
    "profilePicture": "https://cdn.sgwa.raj.in/profiles/USR001234.jpg",
    "createdAt": "2026-01-01T10:00:00Z",
    "updatedAt": "2026-01-08T15:30:00Z"
  }
}
```

---

### 2.2 Update User Profile

**Endpoint:** `PUT /users/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "applicantName": "Rajesh Kumar Sharma",
  "mobile": "9876543210",
  "organizationName": "ABC Industries Pvt Ltd",
  "designation": "Managing Director"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": "USR001234",
    "updatedFields": ["mobile", "designation"]
  }
}
```

---

### 2.3 Change Password

**Endpoint:** `POST /users/change-password`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "currentPassword": "Old SecurePass@123",
  "newPassword": "NewSecurePass@456",
  "confirmPassword": "NewSecurePass@456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 2.4 Upload Profile Picture

**Endpoint:** `POST /users/profile-picture`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request (Form Data):**
```
profilePicture: [File]
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePictureUrl": "https://cdn.sgwa.raj.in/profiles/USR001234.jpg"
  }
}
```

---

## NOC Application APIs

### 3.1 Create New NOC Application

**Endpoint:** `POST /noc/applications`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "applicationType": "Provisional NOC (New Project)",
  "applicationSubType": "Industrial",
  "projectType": "New Project",
  "waterQualityType": "Potable",
  "groundWaterUtilizationFor": "Industry",
  "dateOfCommencement": "2026-06-01"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "NOC application created successfully",
  "data": {
    "applicationId": "NOC2026001234",
    "status": "DRAFT",
    "currentStep": 1,
    "createdAt": "2026-01-09T06:45:00Z"
  }
}
```

---

### 3.2 Update NOC Application (Step-wise)

**Endpoint:** `PUT /noc/applications/{applicationId}/step/{stepNumber}`

**Headers:**
```
Authorization: Bearer {token}
```

**Step 1 - Basic Details:**
```json
{
  "applicationType": "Provisional NOC (New Project)",
  "applicationSubType": "Industrial",
  "projectType": "New Project",
  "waterQualityType": "Potable",
  "groundWaterUtilizationFor": "Industry",
  "industryType": "Textile Manufacturing (Polluting)",
  "dateOfCommencement": "2026-06-01",
  "existingNOCStatus": "No",
  "is MSME": "Yes",
  "msmeType": "Small",
  "msmeRegistrationNumber": "UDYAM-RJ-01-1234567"
}
```

**Step 2 - Location Details:**
```json
{
  "projectName": "ABC Textile Manufacturing Unit",
  "state": "Rajasthan",
  "district": "Jaipur",
  "block": "Sanganer",
  "tehsil": "Sanganer",
  "assessmentUnit": "Jaipur Urban",
  "projectAddress": "Plot No. 123, RIICO Industrial Area, Sanganer, Jaipur - 302029",
  "communicationAddress": "Same as project address",
  "pincode": "302029",
  "latitude": "26.8206",
  "longitude": "75.8472",
  "totalLandArea": "5000",
  "greenBeltArea": "500",
  "geology": "Alluvial"
}
```

**Step 3 - Drinking & Domestic:**
```json
{
  "numberOfWorkers": "150",
  "numberOfResidents": "0",
  "dailyRequirementPerPerson": 135,
  "domesticTotalDaily": 20.25,
  "domesticTotalAnnual": 7391.25
}
```

**Step 4 - Water Requirement:**
```json
{
  "waterActivities": [
    {
      "activity": "Industrial Process",
      "total": 100,
      "freshGW": 80,
      "surface": 0,
      "recycled": 20
    },
    {
      "activity": "Cooling Tower",
      "total": 30,
      "freshGW": 20,
      "surface": 0,
      "recycled": 10
    }
  ],
  "stpCapacity": "25",
  "etpCapacity": "50",
  "recycledWaterUsage": "30",
  "dailyWaterRequirement": "150.25",
  "annualWaterRequirement": "54841.25"
}
```

**Step 5 - GW Structures:**
```json
{
  "existingStructures": [
    {
      "type": "Borewell",
      "yearOfConstruction": "2020",
      "depth": "150",
      "diameter": "6",
      "depthToWaterLevel": "45",
      "discharge": "10",
      "hasMeter": "Yes"
    }
  ],
  "proposedBorewells": 2,
  "proposedTubewells": 0,
  "proposedDugwells": 0,
  "proposedDugCumBorewells": 0,
  "proposedPumps": 3
}
```

**Step 6 - Documents Required (No Update - Informational Step):**
```json
{
  "documentsReviewed": true,
  "userAcknowledgement": "I have reviewed all required documents and have them ready for upload"
}
```

**Step 7 - Upload Documents:**
```json
{
  "documents": {
    "loa": "DOC001234",
    "land_ownership": "DOC001235",
    "site_map": "DOC001236",
    "water_balance": "DOC001237",
    "dpr": "DOC001238",
    "gw_quality": "DOC001239",
    "rwh_plan": "DOC001240",
    "affidavit": "DOC001241",
    "flow_meter": "DOC001242"
  },
  "optionalDocuments": {
    "cte": "DOC001243",
    "msme_cert": "DOC001244"
  }
}
```

**Step 8 - Fee Calculation:**
```json
{
  "feeCalculation": {
    "baseFee": 15000,
    "processingFee": 3000,
    "technicalFee": 2000,
    "gstRate": 18,
    "gstAmount": 3600,
    "totalAmount": 23600,
    "msmeDiscount": 0,
    "breakdown": {
      "applicationFee": 15000,
      "processingCharges": 3000,
      "technicalReviewCharges": 2000,
      "gst18Percent": 3600
    }
  },
  "paymentInitiated": false
}
```

**Step 9 - Payment Receipt:**
```json
{
  "paymentDetails": {
    "paymentMethod": "ONLINE",
    "transactionId": "TXN2026001234",
    "paymentDate": "2026-01-09",
    "amount": 23600,
    "paymentStatus": "SUCCESS",
    "receiptNumber": "RCP/2026/001234",
    "paymentReceiptDocument": "DOC001250"
  }
}
```

**Step 10 - Summary & Submit:**
```json
{
  "declaration": {
    "declarationAccepted": true,
    "declarationText": "I hereby declare that all the information provided in this application is true and correct to the best of my knowledge.",
    "declarationDate": "2026-01-09T08:00:00Z",
    "ipAddress": "192.168.1.100"
  },
  "submissionConfirmation": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Application step updated successfully",
  "data": {
    "applicationId": "NOC2026001234",
    "stepCompleted": 5,
    "nextStep": 6,
    "completionPercentage": 50
  }
}
```

---

### 3.3 Get NOC Application Details

**Endpoint:** `GET /noc/applications/{applicationId}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applicationId": "NOC2026001234",
    "applicantId": "USR001234",
    "status": "DRAFT",
    "currentStep": 5,
    "completionPercentage": 50,
    "applicationType": "Provisional NOC (New Project)",
    "projectName": "ABC Textile Manufacturing Unit",
    "projectLocation": "Jaipur, Rajasthan",
    "dailyWaterRequirement": "150.25",
    "applicationFee": 15000,
    "paymentStatus": "PENDING",
    "createdAt": "2026-01-09T06:45:00Z",
    "updatedAt": "2026-01-09T07:30:00Z",
    "formData": {
      // Complete form data for all steps
    }
  }
}
```

---

### 3.4 Get Document Requirements Checklist (Step 6)

**Endpoint:** `GET /noc/applications/{applicationId}/document-requirements`

**Headers:**
```
Authorization: Bearer {token}
```

**Description:** Get list of required and optional documents based on application type

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "requiredDocuments": [
      {
        "id": "loa",
        "name": "Authorization Letter / Letter of Authority (LOA)",
        "required": true,
        "description": "Authorized signatory letter on company letterhead",
        "uploaded": false,
        "documentId": null
      },
      {
        "id": "land_ownership",
        "name": "Certificate/Affidavit of Land Ownership",
        "required": true,
        "description": "Sale deed, Jamabandi, or valid lease deed",
        "uploaded": true,
        "documentId": "DOC001235"
      }
    ],
    "optionalDocuments": [
      {
        "id": "msme_cert",
        "name": "MSME Certificate",
        "required": false,
        "description": "Udyam registration certificate (if MSME)",
        "uploaded": false,
        "documentId": null
      }
    ],
    "totalRequired": 10,
    "uploaded": 1,
    "completionPercentage": 10
  }
}
```

---

### 3.5 Calculate Application Fee (Step 8)

**Endpoint:** `GET /noc/applications/{applicationId}/calculate-fee`

**Headers:**
```
Authorization: Bearer {token}
```

**Description:** Backend automatically fetches application data (water requirement, project type, MSME status, block category) and calculates the fee

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "feeCalculation": {
      "baseFee": 15000,
      "processingFee": 3000,
      "technicalFee": 2000,
      "gstRate": 18,
      "gstAmount": 3600,
      "totalAmount": 23600,
      "msmeDiscount": 2000,
      "finalAmount": 21600,
      "breakdown": {
        "applicationFee": 15000,
        "processingCharges": 3000,
        "technicalReviewCharges": 2000,
        "msmeDiscount": -2000,
        "subtotal": 18000,
        "gst18Percent": 3600,
        "grandTotal": 21600
      },
      "validityPeriod": "3 Years",
      "paymentDueDate": "2026-01-19T23:59:59Z"
    }
  }
}
```

---

### 3.6 Initiate Application Payment (Step 8)

**Endpoint:** `POST /noc/applications/{applicationId}/initiate-payment`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "amount": 21600,
  "paymentMethod": "ONLINE",
  "paymentGateway": "RAZORPAY"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "paymentId": "PAY001234",
    "orderId": "order_ABC123XYZ789",
    "amount": 21600,
    "currency": "INR",
    "paymentGateway": "RAZORPAY",
    "razorpayKey": "rzp_live_1234567890",
    "razorpayOrderId": "order_ABC123XYZ789",
    "callbackUrl": "https://api.sgwa.raj.in/api/v1/payments/callback",
    "expiresAt": "2026-01-09T09:00:00Z",
    "description": "NOC Application Fee - NOC2026001234"
  }
}
```

---

### 3.7 Upload Payment Receipt (Step 9)

**Endpoint:** `POST /noc/applications/{applicationId}/payment-receipt`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request (Form Data):**
```
paymentReceiptFile: [File - PDF/JPG/PNG]
transactionId: "TXN2026001234"
receiptNumber: "RCP/2026/001234"
paymentDate: "2026-01-09"
paymentMethod: "ONLINE"
amount: 21600
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment receipt uploaded successfully",
  "data": {
    "receiptId": "RCPT001234",
    "documentId": "DOC001250",
    "fileName": "Payment_Receipt_RCP_2026_001234.pdf",
    "uploadedAt": "2026-01-09T08:45:00Z",
    "status": "PENDING_VERIFICATION",
    "verificationRequired": true
  }
}
```

---

### 3.8 Get Application Summary (Step 10)

**Endpoint:** `GET /noc/applications/{applicationId}/summary`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applicationSummary": {
      "applicationId": "NOC2026001234",
      "applicationNumber": "RJ/CGWA/NOC/2026/001234",
      "status": "DRAFT",
      "completionPercentage": 90,
      "basicDetails": {
        "applicationType": "Provisional NOC (New Project)",
        "applicationSubType": "Industrial",
        "projectType": "New Project",
        "isMSME": true
      },
      "projectDetails": {
        "projectName": "ABC Textile Manufacturing Unit",
        "location": "Sanganer, Jaipur, Rajasthan",
        "coordinates": "26.8206°N, 75.8472°E"
      },
      "waterRequirement": {
        "dailyRequirement": "150.25 m³/day",
        "annualRequirement": "54841.25 m³/year"
      },
      "structures": {
        "existing": 1,
        "proposed": 2
      },
      "documentsStatus": {
        "totalRequired": 10,
        "uploaded": 10,
        "percentageComplete": 100
      },
      "paymentStatus": {
        "status": "PAID",
        "amount": 21600,
        "transactionId": "TXN2026001234",
        "receiptNumber": "RCP/2026/001234",
        "paymentDate": "2026-01-09"
      },
      "readyToSubmit": true,
      "missingItems": []
    }
  }
}
```

---

### 3.9 Submit Final Application (Step 10)

**Endpoint:** `POST /noc/applications/{applicationId}/submit-final`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "declaration": {
    "declarationAccepted": true,
    "declarationText": "I hereby declare that all the information provided in this application is true and correct to the best of my knowledge. I understand that any false information may lead to rejection of the application and legal action.",
    "declarationDate": "2026-01-09T08:00:00Z"
  },
  "termsAccepted": true,
  "submissionConfirmation": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "NOC application submitted successfully",
  "data": {
    "applicationId": "NOC2026001234",
    "applicationNumber": "RJ/CGWA/NOC/2026/001234",
    "status": "SUBMITTED",
    "submittedAt": "2026-01-09T08:00:00Z",
    "acknowledgementNumber": "ACK/2026/001234",
    "estimatedProcessingDays": 30,
    "targetCompletionDate": "2026-02-08",
    "trackingUrl": "https://sgwa.raj.in/track/NOC2026001234",
    "acknowledgementPdfUrl": "https://cdn.sgwa.raj.in/acknowledgements/ACK_2026_001234.pdf",
    "nextSteps": [
      "Document verification by DGO office",
      "Technical review by CGWA",
      "Site inspection (if required)",
      "Final approval/rejection"
    ],
    "contactOfficer": {
      "name": "Officer Name",
      "designation": "District Groundwater Officer",
      "email": "dgo.jaipur@sgwa.raj.in",
      "phone": "+91-141-XXXXXXX"
    }
  }
}
```

---

### 3.10 Get All User Applications

**Endpoint:** `GET /noc/applications`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
?status=DRAFT&page=1&limit=10&sortBy=createdAt&order=desc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "applicationId": "NOC2026001234",
        "projectName": "ABC Textile Manufacturing Unit",
        "applicationType": "Provisional NOC (New Project)",
        "status": "DRAFT",
        "currentStep": 5,
        "completionPercentage": 50,
        "createdAt": "2026-01-09T06:45:00Z",
        "updatedAt": "2026-01-09T07:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalRecords": 1,
      "limit": 10
    }
  }
}
```

---

### 3.5 Submit NOC Application

**Endpoint:** `POST /noc/applications/{applicationId}/submit`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "declaration": true,
  "declarationText": "I hereby declare that all information provided is true and correct to the best of my knowledge."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "NOC application submitted successfully",
  "data": {
    "applicationId": "NOC2026001234",
    "status": "SUBMITTED",
    "submittedAt": "2026-01-09T08:00:00Z",
    "acknowledgementNumber": "ACK/2026/001234",
    "estimatedProcessingDays": 30
  }
}
```

---

### 3.6 Delete Draft Application

**Endpoint:** `DELETE /noc/applications/{applicationId}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Application deleted successfully"
}
```

---

## Document Upload APIs

### 4.1 Upload Document

**Endpoint:** `POST /noc/applications/{applicationId}/documents`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request (Form Data):**
```
documentType: "land_ownership"
documentName: "Land Ownership Certificate"
file: [File - PDF/JPG/PNG, Max 5MB]
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "documentId": "DOC001234",
    "documentType": "land_ownership",
    "fileName": "Land_Ownership_Certificate.pdf",
    "fileSize": 1024576,
    "uploadedAt": "2026-01-09T07:45:00Z",
    "fileUrl": "https://cdn.sgwa.raj.in/documents/NOC2026001234/DOC001234.pdf"
  }
}
```

---

### 4.2 Get Application Documents

**Endpoint:** `GET /noc/applications/{applicationId}/documents`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "documentId": "DOC001234",
        "documentType": "land_ownership",
        "documentName": "Land Ownership Certificate",
        "fileName": "Land_Ownership_Certificate.pdf",
        "fileSize": 1024576,
        "uploadedAt": "2026-01-09T07:45:00Z",
        "fileUrl": "https://cdn.sgwa.raj.in/documents/NOC2026001234/DOC001234.pdf",
        "status": "UPLOADED"
      },
      {
        "documentId": "DOC001235",
        "documentType": " site_map",
        "documentName": "Site Map with GPS Coordinates",
        "fileName": "Site_Map.pdf",
        "fileSize": 2048576,
        "uploadedAt": "2026-01-09T07:50:00Z",
        "fileUrl": "https://cdn.sgwa.raj.in/documents/NOC2026001234/DOC001235.pdf",
        "status": "UPLOADED"
      }
    ],
    "totalDocuments": 2,
    "requiredDocuments": 12,
    "uploadedDocuments": 2,
    "completionPercentage": 16.67
  }
}
```

---

### 4.3 Delete Document

**Endpoint:** `DELETE /noc/applications/{applicationId}/documents/{documentId}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

### 4.4 Download Document

**Endpoint:** `GET /noc/applications/{applicationId}/documents/{documentId}/download`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Land_Ownership_Certificate.pdf"

[Binary PDF Data]
```

---

## Payment APIs

### 5.1 Calculate Application Fee

**Endpoint:** `GET /noc/applications/{applicationId}/calculate-fee`

**Headers:**
```
Authorization: Bearer {token}
```

**Description:** Calculate fee based on application data - backend automatically fetches water requirement, project type, MSME status, and block category from the application

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "baseFee": 15000,
    "gstAmount": 2700,
    "totalAmount": 17700,
    "msmeDiscount": 0,
    "breakdown": {
      "applicationFee": 10000,
      "processingFee": 3000,
      "technicalFee": 2000,
      "gst": 2700
    }
  }
}
```

---

### 5.2 Initiate Payment

**Endpoint:** `POST /payments/initiate`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "applicationId": "NOC2026001234",
  "amount": 17700,
  "paymentMethod": "ONLINE",
  "paymentGateway": "RAZORPAY"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "paymentId": "PAY001234",
    "orderId": "order_ABC123XYZ789",
    "amount": 17700,
    "currency": "INR",
    "paymentGateway": "RAZORPAY",
    "razorpayKey": "rzp_test_1234567890",
    "callbackUrl": "https://api.sgwa.raj.in/api/v1/payments/callback",
    "expiresAt": "2026-01-09T09:00:00Z"
  }
}
```

---

### 5.3 Payment Callback (Webhook)

**Endpoint:** `POST /payments/callback`

**Request Body (from Payment Gateway):**
```json
{
  "razorpay_payment_id": "pay_ABC123XYZ789",
  "razorpay_order_id": "order_ABC123XYZ789",
  "razorpay_signature": "signature_hash_here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "paymentId": "PAY001234",
    "status": "SUCCESS",
    "transactionId": "TXN2026001234",
    "receiptNumber": "RCP/2026/001234",
    "paidAt": "2026-01-09T08:30:00Z"
  }
}
```

---

### 5.4 Get Payment Status

**Endpoint:** `GET /payments/{paymentId}/status`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "paymentId": "PAY001234",
    "applicationId": "NOC2026001234",
    "status": "SUCCESS",
    "amount": 17700,
    "transactionId": "TXN2026001234",
    "receiptNumber": "RCP/2026/001234",
    "paymentMethod": "ONLINE",
    "paymentGateway": "RAZORPAY",
    "paidAt": "2026-01-09T08:30:00Z"
  }
}
```

---

### 5.5 Download Payment Receipt

**Endpoint:** `GET /payments/{paymentId}/receipt`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Payment_Receipt_RCP_2026_001234.pdf"

[Binary PDF Data - Receipt with SGWA Logo, Transaction Details, QR Code]
```

---

### 5.6 Upload Payment Receipt (Manual/Offline)

**Endpoint:** `POST /noc/applications/{applicationId}/payment-receipt`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request (Form Data):**
```
paymentReceiptFile: [File - PDF/JPG/PNG]
transactionId: "TXN2026001234"
receiptNumber: "RCP/2026/001234"
paymentDate: "2026-01-09"
paymentMethod: "OFFLINE"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment receipt uploaded successfully",
  "data": {
    "receiptId": "RCPT001234",
    "status": "PENDING_VERIFICATION",
    "uploadedAt": "2026-01-09T08:45:00Z"
  }
}
```

---

## Dashboard APIs

### 6.1 Get Dashboard Statistics

**Endpoint:** `GET /dashboard/statistics`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalApplications": 10,
    "activeApplications": 3,
    "approvedApplications": 5,
    "rejectedApplications": 1,
    "pendingPayments": 1,
    "upcomingDeadlines": [
      {
        "applicationId": "NOC2026001230",
        "projectName": "XYZ Industries",
        "deadlineType": "Compliance Report",
        "deadline": "2026-01-15T23:59:59Z",
        "daysRemaining": 6
      }
    ],
    "recentActivity": [
      {
        "activityId": "ACT001",
        "type": "APPLICATION_SUBMITTED",
        "applicationId": "NOC2026001234",
        "message": "Application submitted for review",
        "timestamp": "2026-01-09T08:00:00Z"
      }
    ]
  }
}
```

---

### 6.2 Get Recent Applications

**Endpoint:** `GET /dashboard/recent-applications`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
?limit=5
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "applicationId": "NOC2026001234",
        "projectName": "ABC Textile Manufacturing Unit",
        "status": "SUBMITTED",
        "submittedAt": "2026-01-09T08:00:00Z",
        "statusBadge": "Under Review"
      }
    ]
  }
}
```

---

### 6.3 Get Announcements

**Endpoint:** `GET /dashboard/announcements`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "announcements": [
      {
        "announcementId": "ANN001",
        "title": "New Guidelines for Industrial NOC Applications",
        "content": "As per latest CGWA directions, industrial applications must include...",
        "type": "NEW",
        "publishedAt": "2026-01-08T10:00:00Z",
        "priority": "HIGH"
      }
    ]
  }
}
```

---

## Master Data APIs

### 7.1 Get Districts by State

**Endpoint:** `GET /master/districts`

**Query Parameters:**
```
?state=Rajasthan
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "districts": [
      "Ajmer", "Alwar", "Banswara", "Baran", "Barmer",
      "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh",
      "Churu", "Dausa", "Dholpur", "Dungarpur", "Ganganagar",
      "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar"
      // ... more districts
    ]
  }
}
```

---

### 7.2 Get Blocks by District

**Endpoint:** `GET /master/blocks`

**Query Parameters:**
```
?district=Jaipur
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "blocks": [
      "Amber", "Bassi", "Chaksu", "Chomu", "Dudu",
      "Jamwaramgarh", "Jhotwara", "Kotputli", "Phagi",
      "Phulera", "Sanganer", "Viratnagar"
    ]
  }
}
```

---

### 7.3 Get Block Category/Classification

**Endpoint:** `GET /master/block-category`

**Query Parameters:**
```
?district=Jaipur&block=Sanganer
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "block": "Sanganer",
    "district": "Jaipur",
    "category": "SEMI_CRITICAL",
    "categoryName": "Semi-Critical",
    "color": "#ffc107",
    "description": "Stage of groundwater development is 70-90%. Restricted extraction allowed with conditions.",
    "validityYears": 3,
    "restrictions": [
      "No new packaged water industries allowed",
      "Rainwater harvesting mandatory",
      "Piezometer installation required"
    ]
  }
}
```

---

### 7.4 Get Industry Types

**Endpoint:** `GET /master/industry-types`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "industries": [
      {
        "value": "textile_manufacturing",
        "label": "Textile Manufacturing",
        "category": "Textile & Garment",
        "isPolluting": true
      },
      {
        "value": "food_processing",
        "label": "Food Processing",
        "category": "Food & Beverage",
        "isPolluting": false
      }
      // ... more industries
    ]
  }
}
```

---

### 7.5 Get Document Types

**Endpoint:** `GET /master/document-types`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "loa",
        "name": "Authorization Letter / Letter of Authority (LOA)",
        "required": true,
        "description": "Authorized signatory letter on company letterhead"
      },
      {
        "id": "land_ownership",
        "name": "Certificate/Affidavit of Land Ownership",
        "required": true,
        "description": "Sale deed, Jamabandi, or valid lease deed"
      }
      // ... more document types
    ]
  }
}
```

---

## Application Tracking APIs

### 8.1 Get Application Status Timeline

**Endpoint:** `GET /noc/applications/{applicationId}/timeline`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "step": "APPLICATION_SUBMITTED",
        "status": "COMPLETED",
        "timestamp": "2026-01-09T08:00:00Z",
        "actor": "Rajesh Kumar Sharma (Applicant)",
        "remarks": "Application submitted for NOC"
      },
      {
        "step": "PAYMENT_VERIFIED",
        "status": "COMPLETED",
        "timestamp": "2026-01-09T08:30:00Z",
        "actor": "System",
        "remarks": "Payment of ₹17,700 verified"
      },
      {
        "step": "DOCUMENTS_VERIFICATION",
        "status": "IN_PROGRESS",
        "timestamp": "2026-01-09T09:00:00Z",
        "actor": "Document Verification Officer",
        "remarks": "Documents under review"
      },
      {
        "step": "SITE_INSPECTION",
        "status": "PENDING",
        "timestamp": null,
        "actor": "Pending",
        "remarks": "Awaiting documents verification"
      }
    ]
  }
}
```

---

### 8.2Get Application Comments/Queries

**Endpoint:** `GET /noc/applications/{applicationId}/comments`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "commentId": "CMT001",
        "author": "DGO Officer",
        "authorRole": "OFFICER",
        "comment": "Please upload updated land ownership certificate dated within last 6 months",
        "timestamp": "2026-01-10T10:00:00Z",
        "status": "OPEN"
      }
    ]
  }
}
```

---

### 8.3 Reply to Comment/Query

**Endpoint:** `POST /noc/applications/{applicationId}/comments/{commentId}/reply`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "reply": "Updated land ownership certificate has been uploaded. Document ID: DOC001240",
  "attachments": ["DOC001240"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Reply submitted successfully",
  "data": {
    "replyId": "RPL001",
    "timestamp": "2026-01-10T11:00:00Z"
  }
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | BAD_REQUEST | Invalid request parameters |
| 401 | UNAUTHORIZED | Invalid or missing authentication token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate resource (e.g., email already exists) |
| 422 | VALIDATION_ERROR | Request validation failed |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeded |
| 500 | INTERNAL_SERVER_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

---

## Rate Limiting

- **Authentication endpoints:** 5 requests per minute
- **Document upload:** 10 files per minute
- **General API calls:** 100 requests per minute

---

## Testing with PowerShell

### Example: User Registration
```powershell
$body = @{
  applicantName = "Rajesh Kumar Sharma"
  email = "rajesh.sharma@example.com"
  mobile = "9876543210"
  password = "SecurePass@123"
  confirmPassword = "SecurePass@123"
  aadhaarNumber = "123456789012"
  panNumber = "ABCDE1234F"
  organizationName = "ABC Industries Pvt Ltd"
  organizationType = "Private Limited Company"
  designation = "Managing Director"
  agreeTerms = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://api.sgwa.rajasthan.gov.in/api/v1/auth/register" -Method POST -Body $body -ContentType "application/json"
```

### Example: Calculate Application Fee
```powershell
$headers = @{
  "Authorization" = "Bearer your_jwt_token_here"
}

$applicationId = "NOC2026001234"
Invoke-RestMethod -Uri "http://api.sgwa.rajasthan.gov.in/api/v1/noc/applications/$applicationId/calculate-fee" -Method GET -Headers $headers
```

### Example: Initiate Payment
```powershell
$headers = @{
  "Authorization" = "Bearer your_jwt_token_here"
  "Content-Type" = "application/json"
}

$body = @{
  applicationType = "Provisional NOC (New Project)"
  applicationSubType = "Industrial"
  projectType = "New Project"
  waterQualityType = "Potable"
  groundWaterUtilizationFor = "Industry"
  dateOfCommencement = "2026-06-01"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://api.sgwa.rajasthan.gov.in/api/v1/noc/applications" -Method POST -Headers $headers -Body $body
```

---

## Notes

1. **Base URL:** Replace with actual production URL when deploying
2. **Authentication:** All protected endpoints require JWT token in Authorization header
3. **File Uploads:** Use multipart/form-data for document uploads
4. **Date Format:** ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
5. **Pagination:** Most list endpoints support `page`, `limit`, `sortBy`, and `order` query parameters
6. **Error Handling:** All errors follow consistent format with `success: false` and `message` field

---

**End of Documentation**
