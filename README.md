# SGWA API - MongoDB Authentication System

A Node.js/Express API with MongoDB authentication supporting user signup, login, and logout.

## Features

- ✅ User registration (signup) with validation
- ✅ User login with JWT authentication
- ✅ User logout
- ✅ Password hashing with bcrypt
- ✅ MongoDB database with Mongoose ODM
- ✅ Proper error handling
- ✅ Environment variable configuration
- ✅ Role-based user system (user, admin, officer)

## Prerequisites

Before running this application, make sure you have:

- **Node.js** (v20.x or higher recommended)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** (comes with Node.js)

## Installation

1. Clone or navigate to the project directory:
```bash
cd C:\Users\DELL\Desktop\sgwa-api
```

2. Install dependencies (already done):
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env` if not already created
   - Update the MongoDB URI if needed

## MongoDB Setup

### Option 1: Local MongoDB
1. Install MongoDB locally from https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   ```bash
   # Windows
   mongod
   ```
3. Keep the default URI: `mongodb://localhost:27017/sgwa_db`

### Option 2: MongoDB Atlas (Cloud)
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and get your connection string
3. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sgwa_db
   ```

## Running the Application

### Development Mode (auto-restart on changes):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### 1. User Signup (Register)
**POST** `/api/auth/signup`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Successful Response (201):**
```json
{
  "message": "User was registered successfully!",
  "user": {
    "id": "65f1234567890abcdef",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Failed! Username is already in use!"
}
```

### 2. User Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Successful Response (200):**
```json
{
  "id": "65f1234567890abcdef",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "user",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful!"
}
```

**Error Response (401):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Invalid password!"
}
```

### 3. User Logout
**POST** `/api/auth/logout`

**Successful Response (200):**
```json
{
  "message": "Logout successful!"
}
```

## Testing the API

### Using cURL:

**Signup:**
```bash
curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"testuser\",\"password\":\"password123\"}"
```

**Logout:**
```bash
curl -X POST http://localhost:3000/api/auth/logout
```

### Using Postman or Thunder Client:
1. Set method to `POST`
2. Set URL to endpoint (e.g., `http://localhost:3000/api/auth/signup`)
3. Set Headers: `Content-Type: application/json`
4. Add JSON body with required fields
5. Send request

## Project Structure

```
sgwa-api/
├── app/
│   ├── config/
│   │   ├── auth.config.js      # JWT configuration
│   │   └── db.config.js        # MongoDB configuration
│   ├── controllers/
│   │   └── auth.controller.js  # Authentication logic
│   ├── middleware/
│   │   └── error.handler.js    # Global error handler
│   ├── models/
│   │   └── user.model.js       # User schema/model
│   └── routes/
│       ├── auth.routes.js      # Auth routes
│       └── user.routes.js      # User routes
├── .env                        # Environment variables
├── .env.example                # Environment template
├── .gitignore                  # Git ignore file
├── index.js                    # Main entry point
└── package.json                # Dependencies
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/sgwa_db |
| `JWT_SECRET` | Secret key for JWT | (must be changed in production) |
| `JWT_EXPIRATION` | JWT expiration time in seconds | 86400 (24 hours) |

## Security Notes

⚠️ **Important for Production:**
1. Change the `JWT_SECRET` to a strong, random string
2. Use HTTPS for all API calls
3. Enable CORS with specific origins
4. Add rate limiting to prevent brute force attacks
5. Use environment-specific MongoDB credentials
6. Never commit `.env` file to version control

## Error Handling

The API uses a global error handler that returns errors in this format:

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Error message here"
}
```

Common status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (account deactivated)
- `404` - Not Found (user doesn't exist)
- `500` - Internal Server Error

## User Roles

The system supports three user roles:
- `user` - Default role for regular users
- `admin` - Administrative access
- `officer` - Officer/staff access

## User Schema

```javascript
{
  username: String (required, unique, min 3 chars)
  email: String (optional, validated format)
  password: String (required, hashed, min 6 chars)
  role: String (enum: user/admin/officer)
  isActive: Boolean (default: true)
  createdAt: Date (auto-generated)
  updatedAt: Date (auto-generated)
}
```

## Troubleshooting

### MongoDB Connection Issues
- **Error:** "Connection error"
  - **Solution:** Make sure MongoDB is running locally or check your Atlas connection string

### Module Not Found Errors
- **Error:** "Cannot find module"
  - **Solution:** Run `npm install` to install all dependencies

### Port Already in Use
- **Error:** "EADDRINUSE: address already in use"
  - **Solution:** Change the PORT in `.env` or kill the process using port 3000

## Next Steps

Potential enhancements:
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Refresh token mechanism
- [ ] User profile management
- [ ] Admin dashboard
- [ ] Rate limiting
- [ ] API documentation with Swagger
- [ ] Unit and integration tests

## License

ISC

## Author

SGWA Development Team
