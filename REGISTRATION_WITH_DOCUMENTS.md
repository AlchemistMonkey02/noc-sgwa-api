# Registration with Document Upload - Testing Guide

## New Endpoint: Register with Documents

**POST** `/api/auth/register-with-documents`

This endpoint allows users to register and upload ID proof documents (Aadhaar/ID Proof) in a single request.

---

## Multipart Form Data Request

### Using PowerShell

```powershell
# Prepare form data
$userData = @{
    title = "Mr"
    firstName = "Rajesh"
    lastName = "Kumar"
    dateOfBirth = "1990-05-15"
    gender = "MALE"
    uidNumber = "987654321012"
    idProofType = "AADHAR"
    idProofNumber = "9876-5432-1012"
    email = "rajesh.kumar@example.com"
    phone = "9876543210"
    communicationAddress = @{
        addressLine1 = "123 MG Road"
        addressLine2 = "Vaishali Nagar"
        addressLine3 = "C-Scheme"
        state = "Rajasthan"
        district = "Jaipur"
        subDistrict = "Jaipur"
        pincode = "302001"
    }
    username = "rajeshkumar"
    password = "SecurePass@123"
    confirmPassword = "SecurePass@123"
    securityQuestion = "What is your pet's name?"
    securityAnswer = "Tommy"
} | ConvertTo-Json

# Create multipart form
$boundary = [System.Guid]::NewGuid().ToString()
$FilePath1 = "C:\path\to\aadhar.pdf"
$FilePath2 = "C:\path\to\id_proof.pdf"

# Build multipart body manually or use Invoke-WebRequest with -Form parameter (PS 7+)

# PowerShell 7+ (Recommended)
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register-with-documents" `
  -Method POST `
  -Form @{
    userData = $userData
    AADHAR = Get-Item -Path $FilePath1
    ID_PROOF = Get-Item -Path $FilePath2
  }
```

### Using cURL

```bash
curl -X POST http://localhost:3000/api/auth/register-with-documents \
  -F 'userData={
    "title": "Mr",
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "dateOfBirth": "1990-05-15",
    "gender": "MALE",
    "uidNumber": "987654321012",
    "idProofType": "AADHAR",
    "idProofNumber": "9876-5432-1012",
    "email": "rajesh.kumar@example.com",
    "phone": "9876543210",
    "communicationAddress": {
      "addressLine1": "123 MG Road",
      "addressLine2": "Vaishali Nagar",
      "addressLine3": "C-Scheme",
      "state": "Rajasthan",
      "district": "Jaipur",
      "subDistrict": "Jaipur",
      "pincode": "302001"
    },
    "username": "rajeshkumar",
    "password": "SecurePass@123",
    "confirmPassword": "SecurePass@123",
    "securityQuestion": "What is your pet'\''s name?",
    "securityAnswer": "Tommy"
  }' \
  -F 'AADHAR=@/path/to/aadhar.pdf' \
  -F 'ID_PROOF=@/path/to/id_proof.pdf'
```

### Using Postman

1. **Method:** POST
2. **URL:** `http://localhost:3000/api/auth/register-with-documents`
3. **Body:** Select `form-data`
4. **Add Fields:**
   - Key: `userData` | Type: Text | Value: (paste JSON below)
   - Key: `AADHAR` | Type: File | Value: Select Aadhaar PDF file
   - Key: `ID_PROOF` | Type: File | Value: Select ID Proof PDF file

**userData JSON:**
```json
{
  "title": "Mr",
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "dateOfBirth": "1990-05-15",
  "gender": "MALE",
  "uidNumber": "987654321012",
  "idProofType": "AADHAR",
  "idProofNumber": "9876-5432-1012",
  "email": "rajesh.kumar@example.com",
  "phone": "9876543210",
  "communicationAddress": {
    "addressLine1": "123 MG Road",
    "addressLine2": "Vaishali Nagar",
    "addressLine3": "C-Scheme",
    "state": "Rajasthan",
    "district": "Jaipur",
    "subDistrict": "Jaipur",
    "pincode": "302001"
  },
  "username": "rajeshkumar",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123",
  "securityQuestion": "What is your pet's name?",
  "securityAnswer": "Tommy"
}
```

---

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "userId": "695cfa2dbf74fe74ab7d1ae9",
    "email": "rajesh.kumar@example.com",
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "documents": [
      {
        "documentType": "AADHAR",
        "documentId": "695cfb1234abcdef12345678",
        "fileName": "aadhar_1704552000000.pdf"
      },
      {
        "documentType": "ID_PROOF",
        "documentId": "695cfb5678abcdef87654321",
        "fileName": "id_proof_1704552001000.pdf"
      }
    ]
  },
  "message": "Registration successful! Please check your email for further instructions."
}
```

---

## View/Download Uploaded Documents

After registration, you can access the documents using the Document Management API:

### 1. List User Documents
**GET** `/api/documents?userId=USER_ID` (requires authentication)

```powershell
$token = "YOUR_JWT_TOKEN"
Invoke-WebRequest -Uri "http://localhost:3000/api/documents" `
  -Headers @{"Authorization"="Bearer $token"}
```

### 2. View Document
**GET** `/api/documents/:id/view`

```powershell
Start-Process "http://localhost:3000/api/documents/DOCUMENT_ID/view?token=$token"
```

### 3. Download Document
**GET** `/api/documents/:id/download`

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/documents/DOCUMENT_ID/download" `
  -Headers @{"Authorization"="Bearer $token"} `
  -OutFile "downloaded_document.pdf"
```

### 4. Send Document (Email - if needed)
You can use the document ID to send it via email using your email service.

---

## File Requirements

### Supported Document Types
- `AADHAR` - Aadhaar card
- `ID_PROOF` - Any government-issued ID (PAN, Passport, Voter ID, Driving License)

### File Validation
- **Max file size:** 10MB per file
- **Allowed formats:** PDF, JPG, JPEG, PNG
- **Storage location:** `uploads/{userId}/{documentType}/{filename}`

---

## Complete Registration Flow with Documents

### Step 1: Send OTP to Mobile & Email
```powershell
# Mobile OTP
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/send-otp/mobile" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone": "9876543210"}'

# Email OTP
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/send-otp/email" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email": "rajesh.kumar@example.com"}'
```

### Step 2: Verify OTPs
```powershell
# Verify Mobile
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/verify-otp" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "identifier": "9876543210",
    "otp": "123456",
    "type": "MOBILE"
  }'

# Verify Email
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/verify-otp" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "identifier": "rajesh.kumar@example.com",
    "otp": "654321",
    "type": "EMAIL"
  }'
```

### Step 3: Check Username Availability
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/check-username/rajeshkumar"
```

### Step 4: Register with Documents
Use the multipart form request shown above.

### Step 5: Login
```powershell
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "username": "rajesh.kumar@example.com",
    "password": "SecurePass@123"
  }'

$token = ($loginResponse.Content | ConvertFrom-Json).data.token
```

### Step 6: View Uploaded Documents
```powershell
# List all documents
Invoke-WebRequest -Uri "http://localhost:3000/api/documents" `
  -Headers @{"Authorization"="Bearer $token"}

# Download Aadhaar
Invoke-WebRequest -Uri "http://localhost:3000/api/documents/DOCUMENT_ID/download" `
  -Headers @{"Authorization"="Bearer $token"} `
  -OutFile "aadhar.pdf"
```

---

## Error Responses

### Missing Documents
```json
{
  "success": false,
  "error": {
    "code": "MISSING_DOCUMENTS",
    "message": "At least one ID proof document is required"
  }
}
```

### Invalid File Type
```json
{
  "success": false,
  "error": {
    "message": "Only PDF, JPG, and PNG files are allowed"
  }
}
```

### File Too Large
```json
{
  "success": false,
  "error": {
    "message": "File size must not exceed 10MB"
  }
}
```

---

## Two Registration Options

### Option 1: Register with Documents (Recommended)
**POST** `/api/auth/register-with-documents`
- Upload Aadhaar/ID proof during registration
- Complete profile in one step
- Multipart form-data

### Option 2: Register Then Upload
1. **POST** `/api/auth/register` - Register without documents
2. **POST** `/api/documents/upload` - Upload documents later (requires login)
- Standard JSON request
- Upload documents separately after login

---

## Document Access Control

- ✅ Users can only access their own documents
- ✅ Officers can view/verify applicant documents
- ✅ Documents are stored securely with unique filenames
- ✅ File type and size validation
- ✅ Automatic cleanup on user deletion (TODO)

---

## Production Considerations

- [ ] Implement cloud storage (AWS S3, Azure Blob, Google Cloud Storage)
- [ ] Add virus scanning for uploaded files
- [ ] Implement document expiry/renewal
- [ ] Add watermarking for sensitive documents
- [ ] Implement document encryption at rest
- [ ] Add audit logging for document access
- [ ] Implement document versioning
- [ ] Add OCR for automatic data extraction from Aadhaar

---

**All endpoints are ready to use!** 🚀

The document upload integration with registration is fully functional. Users can now register and upload their ID proofs in a single request.
