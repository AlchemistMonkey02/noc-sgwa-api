# NOC Application - Simplified (Automatic Linking)

## ✅ Automatic User and Company Linking

**Users no longer need to send `userId` or `companyId` in the request!**

Both are automatically captured from:
- **User ID**: From JWT authentication token
- **Company ID**: From verified company in middleware

---

## How It Works

### 1. User Logs In
```powershell
POST /api/auth/login
Body: { "username": "user@example.com", "password": "pass123" }

Response: { "token": "eyJhbG..." }
```

### 2. User Registers Company
```powershell
POST /api/companies/register
Headers: Authorization: Bearer {token}
Body: { company details }

Response: { "companyId": "695cfd12..." }
```

### 3. Apply for NOC (SIMPLIFIED!)

**OLD Way (Required companyId):**
```json
{
  "companyId": "695cfd12...",    // ← Had to send this
  "applicationType": "NEW_WELL",
  "projectDetails": { ... }
}
```

**NEW Way (Automatic!):**
```json
{
  "applicationType": "NEW_WELL",  // ← No userId or companyId needed!
  "projectDetails": { ... },
  "waterRequirement": { ... }
}
```

### 4. System Automatically Links

```javascript
// Behind the scenes:
const userId = req.user.id;           // From JWT token
const companyId = req.company._id;    // From middleware

// Saved to database:
{
  userId: "user123",        // ← Automatic from login
  companyId: "company456",  // ← Automatic from verification
  applicationType: "NEW_WELL",
  ...
}
```

---

## Example Request

### PowerShell
```powershell
$token = "YOUR_JWT_TOKEN"

$nocData = @{
    applicationType = "NEW_WELL"
    projectDetails = @{
        projectName = "Industrial Borewell"
        projectLocation = @{
            state = "Rajasthan"
            district = "Jaipur"
            block = "Sanganer"
            village = "Vatika"
        }
    }
    waterRequirement = @{
        dailyRequirement = 100
        purpose = "INDUSTRIAL"
    }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:3000/api/applications/noc" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $nocData
```

### cURL
```bash
curl -X POST http://localhost:3000/api/applications/noc \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationType": "NEW_WELL",
    "projectDetails": {
      "projectName": "Industrial Borewell"
    },
    "waterRequirement": {
      "dailyRequirement": 100,
      "purpose": "INDUSTRIAL"
    }
  }'
```

---

## Response

```json
{
  "success": true,
  "data": {
    "_id": "noc001",
    "applicationId": "uuid-here",
    "userId": "user123",              // ← Automatically set
    "companyId": "company456",        // ← Automatically set
    "applicationType": "NEW_WELL",
    "status": "DRAFT",
    "projectDetails": { ... },
    "waterRequirement": { ... }
  },
  "message": "Application draft saved successfully"
}
```

---

## What Happens Automatically

| Field | Source | How |
|-------|--------|-----|
| `userId` | JWT Token | Extracted from `req.user.id` |
| `companyId` | Middleware | Verified and set by `companyMiddleware` |
| `applicationId` | System | Auto-generated UUID |
| `applicationNumber` | System | Auto-generated on submit |

---

## Validation Flow

```
1. User sends request with JWT token
2. Auth middleware extracts userId
3. Company middleware:
   - Checks user has verified company
   - Attaches company to req.company
4. NOC Controller:
   - Gets userId from req.user.id
   - Gets companyId from req.company._id
5. NOC Service:
   - Creates application with both
6. Database saves with full traceability
```

---

## Benefits

✅ **Simpler Frontend**: No need to track/send userId or companyId  
✅ **More Secure**: Can't forge userId or use someone else's company  
✅ **Automatic Validation**: Middleware ensures company exists & is verified  
✅ **Full Traceability**: Every NOC knows who applied and for which company  
✅ **Cleaner API**: Less fields to send in requests  

---

## Multiple Companies Scenario

**Q: What if user has multiple companies?**

**A:** User must send companyId to specify which company:

```json
{
  "companyId": "company789",  // ← Specify when user has multiple
  "applicationType": "NEW_WELL",
  ...
}
```

Middleware will verify:
- Company exists
- Company belongs to this user
- Company is verified and active

---

## Summary

**Before:**
```json
{
  "userId": "user123",       // ← Had to send
  "companyId": "company456", // ← Had to send
  "applicationType": "NEW_WELL"
}
```

**After:**
```json
{
 "applicationType": "NEW_WELL"  // ← Just send application data!
}
```

**System automatically:**
- ✅ Links to logged-in user
- ✅ Links to user's verified company
- ✅ Validates everything
- ✅ Ensures security

**Much easier for frontend!** 🎉
