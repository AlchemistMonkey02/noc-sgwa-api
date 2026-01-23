# Self-Compliance API Guide

Base URL: `http://localhost:3000/api/self-compliance`

## Overview
This API allows users to perform a multi-step self-compliance check.
1.  **Start**: Initialize a session.
2.  **Step 1-5**: Submit data for each step.
3.  **Upload**: Upload required evidence.
4.  **Submit**: Final submission triggers AI auto-validation.

---

## 1. Start Compliance Session
**Endpoint**: `POST /start`
**Description**: Starts a new session or retrieves an existing draft.

**Request**:
```json
{
  "applicationId": "YOUR_APPLICATION_ID" 
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "complianceId": "uuid-string",
    "currentStep": 1,
    "status": "IN_PROGRESS"
  }
}
```

---

## 2. Submit Step Data
**Endpoint**: `POST /:id/step`
**Description**: Saves data for a specific step. `id` is the `complianceId` returned from `/start`.

### Step 1: Flow Meters
**Payload**:
```json
{
  "step": 1,
  "responses": {
    "digitalFlowMetersInstalled": true,
    "meterCalibrationDone": true,
    "remarks": "Meters installed on all extraction points."
  }
}
```

### Step 2: Data Submission
**Payload**:
```json
{
  "step": 2,
  "responses": {
    "quarterlyReportsSubmitted": true,
    "dataAccurate": true,
    "remarks": "Reports submitted for Q1 and Q2."
  }
}
```

### Step 3: Rainwater Harvesting
**Payload**:
```json
{
  "step": 3,
  "responses": {
    "rainwaterHarvestingImplemented": true,
    "rainwaterStructureFunctional": true,
    "remarks": "Rooftop harvesting functional."
  }
}
```

### Step 4: Extraction Limits
**Payload**:
```json
{
  "step": 4,
  "responses": {
    "extractionWithinLimits": true,
    "excessExtractionReason": "",
    "remarks": "Extraction is within 100 KLD limit."
  }
}
```

### Step 5: NOC Conditions & Violations
**Payload**:
```json
{
  "step": 5,
  "responses": {
    "nocConditionsMet": true,
    "anyViolations": false,
    "violationDetails": "",
    "remarks": "All conditions met."
  }
}
```

---

## 3. Upload Documents
**Endpoint**: `POST /:id/upload`
**Content-Type**: `multipart/form-data`

**Fields**:
-   `file`: The file to upload (PDF, JPG).
-   `documentType`: One of `NOC_CERTIFICATE`, `FLOW_METER_CALIBRATION`, `QUARTERLY_DATA`, `RAINWATER_PHOTOS`, `OTHER`.

**cURL Example**:
```bash
curl -X POST "http://localhost:3000/api/self-compliance/{{COMPLIANCE_ID}}/upload" \
  -F "file=@/path/to/calibration_cert.pdf" \
  -F "documentType=FLOW_METER_CALIBRATION"
```

---

## 4. Final Submission (AI Validation)
**Endpoint**: `POST /:id/submit`
**Description**: Triggers the AI validation logic.

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "SUBMITTED",
    "validationResult": {
      "autoStatus": "AUTO_APPROVED",
      "score": 100,
      "criticalIssues": []
    }
  },
  "message": "✅ Compliance AUTO-APPROVED! All requirements met."
}
```

---

## 5. Get Status
**Endpoint**: `GET /:id/status`
**Description**: Retrieve full details of the compliance session including progress and AI results.

**Response**:
```json
{
  "success": true,
  "data": {
    "complianceId": "uuid-string",
    "applicationId": "YOUR_APPLICATION_ID",
    "currentStep": 5,
    "status": "SUBMITTED",
    "stepData": { "step1": { ... }, "step2": { ... } },
    "documents": [ { "documentId": "...", "type": "..." } ],
    "validationResult": { ... }
  }
}
```

---

## 6. View Uploaded Documents
To view or download documents related to any application or compliance session:

### List Application Documents
**Endpoint**: `GET /api/documents/application/:applicationId`
**Description**: Get all documents linked to an application.

### View Document
**Endpoint**: `GET /api/documents/:documentId/view`

### Download Document
**Endpoint**: `GET /api/documents/:documentId/download`

---

## 7. General Application Details
To fetch full details of the parent NOC application:

**Endpoint**: `GET /api/applications/noc/:id`
**Description**: Supports both MongoDB `_id` and custom `applicationId`.
