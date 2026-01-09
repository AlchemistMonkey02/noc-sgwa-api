# Registration API - Updated Guide

## POST `/api/auth/register`

The registration endpoint now supports **both** JSON and multipart requests with **optional** document uploads.

---

## Option 1: JSON Registration (No Documents)

### Request
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "title": "Mr",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "gender": "MALE",
    "idProofType": "AADHAR",
    "idProofNumber": "1234-5678-9012",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "communicationAddress": {
      "addressLine1": "123 Main Street",
      "state": "Rajasthan",
      "district": "Jaipur",
      "pincode": "302001"
    },
    "username": "johndoe",
    "password": "SecurePass@123",
    "confirmPassword": "SecurePass@123"
  }'
```

### Response
```json
{
  "success": true,
  "data": {
    "userId": "695cfa2dbf74fe74ab7d1ae9",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "Registration successful!"
}
```

---

## Option 2: Multipart Registration (With Optional Documents)

### Postman Setup
1. **Method:** POST
2. **URL:** `http://localhost:3000/api/auth/register`
3. **Body:** form-data
4. **Fields:**
   - `userData` (Text) - JSON string with all user data
   - `AADHAR` (File) - Optional Aadhaar document
   - `ID_PROOF` (File) - Optional ID proof document

### userData Field (JSON):
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
  "phone": "9876543211",
  "communicationAddress": {
    "addressLine1": "123 MG Road",
    "state": "Rajasthan",
    "district": "Jaipur",
    "pincode": "302001"
  },
  "username": "rajeshkumar",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123"
}
```

### Response (With Documents)
```json
{
  "success": true,
  "data": {
    "userId": "695cfb842d079a73647e5aca",
    "email": "rajesh.kumar@example.com",
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "documents": [
      {
        "documentType": "AADHAR",
        "documentId": "695cfb1234abcdef12345678",
        "fileName": "AADHAR_1704552000000.pdf"
      }
    ]
  },
  "message": "Registration successful!"
}
```

---

## Field Requirements

### Mandatory Fields
- ✅ Title (Mr/Mrs/Ms/Dr/Prof)
- ✅ First Name & Last Name
- ✅ Date of Birth
- ✅ Gender (MALE/FEMALE/OTHER)
- ✅ ID Proof Type
- ✅ ID Proof Number
- ✅ Email & Phone
- ✅ Communication Address (Line 1, State, District, Pincode)
- ✅ Password & Confirm Password

### Optional Fields
- UID/Aadhaar Number
- Address Lines 2 & 3, Sub-District
- Username (auto-generated if not provided)
- Security Question & Answer
- **Documents (AADHAR, ID_PROOF)** ⬅️ **Now Optional!**
- Organization details
- PAN/GST Numbers

---

## Document Upload Details

### Supported Formats
- PDF, JPG, JPEG, PNG
- Max size: 10MB per file

### Document Types
- `AADHAR` - Aadhaar card
- `ID_PROOF` - PAN, Passport, Voter ID, Driving License

### Upload Behavior
- ✅ Documents are **optional** - users can register without uploading
- ✅ Users can upload later via `/api/documents/upload` after login
- ✅ Aadhaar OR ID Proof OR Both - any combination works
- ✅ Files stored securely in `uploads/temp/` then moved to user folder

---

## Complete Registration Flow

### Step 1: Send OTPs (Optional but recommended)
```powershell
# Mobile OTP
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/send-otp/mobile" `
  -Method POST -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone": "9876543210"}'

# Email OTP  
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/send-otp/email" `
  -Method POST -Headers @{"Content-Type"="application/json"} `
  -Body '{"email": "user@example.com"}'
```

### Step 2: Verify OTPs
```powershell
# Verify both mobile and email
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/verify-otp" `
  -Method POST -Headers @{"Content-Type"="application/json"} `
  -Body '{"identifier": "9876543210", "otp": "123456", "type": "MOBILE"}'
```

### Step 3: Check Username Availability
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/check-username/johndoe"
```

### Step 4: Register
Choose JSON (without documents) or Multipart (with optional documents)

### Step 5: Login
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST -Headers @{"Content-Type"="application/json"} `
  -Body '{"username": "user@example.com", "password": "SecurePass@123"}'
```

---

## Upload Documents Later (If needed)

If users skip document upload during registration, they can upload later:

```powershell
POST /api/documents/upload
Headers: Authorization: Bearer {token}
Body: multipart/form-data
  - document (file)
  - documentType (AADHAR or ID_PROOF)
```

---

## Summary of Changes

✅ **Single Endpoint:** `/api/auth/register` handles everything  
✅ **Flexible:** Accepts JSON or multipart form-data  
✅ **Optional Documents:** Users can register with or without files  
✅ **Same Response:** Consistent response format  
✅ **No Breaking Changes:** Existing JSON registrations still work  

---

**Server running and ready to test!** 🚀

Both registration methods work on the same endpoint now.
