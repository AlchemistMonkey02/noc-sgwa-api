# Quick Setup Instructions

## Configure MongoDB Atlas Connection

Your `.env` file needs to have your MongoDB Atlas credentials. Follow these steps:

### Step 1: Open .env file
Open the file: `C:\Users\DELL\Desktop\sgwa-api\.env`

### Step 2: Add these lines to your .env file:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Atlas Configuration
DB_USERNAME=your_actual_mongodb_username
DB_PASSWORD=your_actual_mongodb_password

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024

# JWT Expiration (in seconds)
JWT_EXPIRATION=86400
```

### Step 3: Replace the placeholders

Replace:
- `your_actual_mongodb_username` with your MongoDB Atlas username
- `your_actual_mongodb_password` with your MongoDB Atlas password

**Connection String Used:**
```
mongodb+srv://<DB_USERNAME>:<DB_PASSWORD>@cluster0.vonp3t0.mongodb.net/noc?appName=Cluster0
```

### Step 4: Start the server

```bash
npm start
```

## How it Works

The `db.config.js` file now:
1. Reads `DB_USERNAME` and `DB_PASSWORD` from environment variables
2. Constructs the MongoDB Atlas connection string automatically
3. Database name: `noc`
4. Falls back to local MongoDB if credentials are not provided

## Security Notes

✅ The `.env` file is in `.gitignore` - your credentials won't be committed to git
✅ Use strong passwords
✅ Never share your `.env` file

## Testing

After updating `.env` with your credentials:

```bash
npm start
```

You should see:
```
Successfully connected to MongoDB.
Server is running on port http://localhost:3000.
```

Then test signup:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/signup" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username":"testuser","email":"test@example.com","password":"password123"}'
```
