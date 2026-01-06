# SGWA API - Testing Guide

## Prerequisites

1. Make sure MongoDB is running (MongoDB Atlas with credentials set)
2. Configure email in `.env` file
3. Run `npm install` if not done already

## Environment Setup

Update your `.env` file:

```bash
# MongoDB
DB_USERNAME=your_actual_mongodb_username
DB_PASSWORD=your_actual_mongodb_password

# Email (Gmail example)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password

# JWT
JWT_SECRET=change_this_to_random_secret_key
```

## Start the Server

```bash
npm start
```

Expected output:
```
✓ MongoDB connected
🚀 Server is running on http://localhost:3000
📱 Environment: development
📧 Email configured: Yes
✅ API Ready!
```

## Test the API

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Register New User
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210",
    "password": "password123",
    "confirmPassword": "password123",
    "organizationName": "Test Company",
    "organizationType": "COMPANY"
  }'
```

**Expected**: 
- HTTP 201 Created
- Welcome email sent to john.doe@example.com
- User created in database

### 3. Login
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "username": "john.doe@example.com",
    "password": "password123"
  }'
```

**Expected**: 
- HTTP 200 OK
- JWT token returned
- Login notification email sent

### 4. Get Profile (use token from login)
```powershell
$token = "your_jwt_token_here"
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/profile" `
  -Method GET `
  -Headers @{
    "Authorization"="Bearer $token"
    "Content-Type"="application/json"
  }
```

### 5. Update Profile
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/profile" `
  -Method PUT `
  -Headers @{
    "Authorization"="Bearer $token"
    "Content-Type"="application/json"
  } `
  -Body '{
    "firstName": "Jane",
    "address": {
      "city": "Jaipur",
      "state": "Rajasthan",
      "pincode": "302001"
    }
  }'
```

## Available Endpoints

### ✅ Auth Module (8 endpoints)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### ⏳ Coming Next
- Document upload/download
- Master data APIs (districts, blocks)
- NOC applications
- Calculators
- All other modules...

## Files Created (Phase 1B - Auth Module)

### Auth Module Files
1. `app/auth/user.model.js` - Enhanced User model
2. `app/auth/auth.validator.js` - Joi validation schemas
3. `app/auth/auth.service.js` - Business logic
4. `app/auth/auth.controller.js` - HTTP handlers
5. `app/auth/auth.routes.js` - Route definitions

### Shared Files
6. `app/config/jwt.config.js` - JWT configuration
7. `app/middleware/auth.middleware.js` - Auth & authorization
8. `app/middleware/error.middleware.js` - Error handler
9. `index.js` - Main app (updated)
10. `.env.example` - Environment template

### Email Templates
11. `app/templates/emails/welcome.html` ✅
12. `app/templates/emails/login-notification.html` ✅
13. `app/templates/emails/application-submitted.html` ✅

### Utilities
14. `app/utils/logger.js` ✅
15. `app/utils/email.service.js` ✅

**Total: 15 files created/updated**

## Common Issues

### Email Not Sending
- Check SMTP credentials
- For Gmail, use App Password (not regular password)
- Enable 2FA on Gmail first

### MongoDB Connection Failed
- Check DB_USERNAME and DB_PASSWORD in `.env`
- Verify MongoDB Atlas cluster is running
- Check IP whitelist in MongoDB Atlas

### JWT Token Expired
- Use refresh token endpoint
- Token expires in 1 hour by default

## Next Steps

After testing auth APIs successfully:
1. Implement Document Management module
2. Add Master Data APIs
3. Create NOC Application module
4. And so on...

Would you like me to continue with the next module?
