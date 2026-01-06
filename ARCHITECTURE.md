# SGWA API - Modular Architecture

## Feature-Based Folder Structure

Each feature/service has its own folder containing all related files:

```
sgwa-api/
├── app/
│   ├── auth/                    # Authentication & User Management
│   │   ├── auth.controller.js   # Login, register, logout handlers
│   │   ├── auth.routes.js       # Auth routes definition
│   │   ├── auth.service.js      # Business logic (JWT, password hashing)
│   │   ├── auth.validator.js    # Input validation schemas
│   │   └── user.model.js        # User mongoose model
│   │
│   ├── noc/                     # NOC Applications Module
│   │   ├── noc.controller.js    # NOC CRUD operations
│   │   ├── noc.routes.js        # NOC application routes
│   │   ├── noc.service.js       # NOC business logic
│   │   ├── noc.validator.js     # NOC validation rules
│   │   ├── noc-application.model.js    # NOC Application schema
│   │   ├── noc-certificate.model.js    # NOC Certificate schema
│   │   └── noc-query.model.js          # Application queries schema
│   │
│   ├── water-budget/            # Water Budget Calculator
│   │   ├── water-budget.controller.js
│   │   ├── water-budget.routes.js
│   │   ├── water-budget.service.js
│   │   └── water-budget.validator.js
│   │
│   ├── calculators/             # EC & Abstraction Calculators
│   │   ├── ec-calculator.controller.js
│   │   ├── abstraction-calculator.controller.js
│   │   ├── calculator.routes.js
│   │   ├── calculator.service.js
│   │   └── calculator.validator.js
│   │
│   ├── rig/                     # Rig Registry & Permits
│   │   ├── rig.controller.js
│   │   ├── rig.routes.js
│   │   ├── rig.service.js
│   │   ├── rig.validator.js
│   │   ├── rig-registry.model.js
│   │   └── rig-permit.model.js
│   │
│   ├── compliance/              # Compliance Reports
│   │   ├── compliance.controller.js
│   │   ├── compliance.routes.js
│   │   ├── compliance.service.js
│   │   ├── compliance.validator.js
│   │   └── compliance-report.model.js
│   │
│   ├── officer/                 # Officer Portal
│   │   ├── officer.controller.js
│   │   ├── officer.routes.js
│   │   ├── officer.service.js
│   │   ├── officer.validator.js
│   │   └── inspection.model.js
│   │
│   ├── documents/               # Document Management
│   │   ├── document.controller.js
│   │   ├── document.routes.js
│   │   ├── document.service.js
│   │   ├── document.model.js
│   │   └── upload.middleware.js
│   │
│   ├── master-data/             # Master Data (Districts, Blocks, etc.)
│   │   ├── master.controller.js
│   │   ├── master.routes.js
│   │   ├── master.service.js
│   │   ├── district.model.js
│   │   ├── block.model.js
│   │   └── industry.model.js
│   │
│   ├── public/                  # Public APIs
│   │   ├── public.controller.js
│   │   ├── public.routes.js
│   │   └── public.service.js
│   │
│   ├── payments/                # Payment Processing
│   │   ├── payment.controller.js
│   │   ├── payment.routes.js
│   │   ├── payment.service.js
│   │   └── payment.model.js
│   │
│   ├── config/                  # Shared Configuration
│   │   ├── db.config.js         # MongoDB connection
│   │   ├── jwt.config.js        # JWT settings
│   │   ├── email.config.js      # Email SMTP config
│   │   └── constants.js         # App-wide constants
│   │
│   ├── middleware/              # Global Middleware
│   │   ├── auth.middleware.js   # JWT authentication
│   │   ├── error.middleware.js  # Error handler
│   │   └── rateLimit.middleware.js
│   │
│   ├── utils/                   # Shared Utilities
│   │   ├── logger.js            # Winston logger
│   │   ├── email.service.js     # Email sending service
│   │   ├── pdf.service.js       # PDF generation
│   │   ├── qr.service.js        # QR code generation
│   │   └── helpers.js           # Helper functions
│   │
│   └── templates/               # Email Templates
│       └── emails/
│           ├── welcome.html
│           ├── login-notification.html
│           ├── application-submitted.html
│           ├── query-raised.html
│           ├── application-approved.html
│           └── password-reset.html
│
├── uploads/                     # File upload directory
├── .env                         # Environment variables
├── .env.example                 # Environment template
└── index.js                     # App entry point
```

## Module Structure Pattern

Each module follows this pattern:

```
module-name/
├── module-name.controller.js   # HTTP request handlers
├── module-name.routes.js       # Route definitions
├── module-name.service.js      # Business logic
├── module-name.validator.js    # Joi validation schemas
└── module-name.model.js        # Mongoose models
```

### Example: NOC Module

**File**: `app/noc/noc.controller.js`
```javascript
// Handles HTTP requests, delegates to service
exports.createNOC = async (req, res, next) => {
  try {
    const result = await nocService.createApplication(req.body, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
```

**File**: `app/noc/noc.service.js`
```javascript
// Contains business logic
exports.createApplication = async (data, user) => {
  // Validate block category
  // Calculate fees
  // Generate application number
  // Save to database
  // Send email notification
  return application;
};
```

**File**: `app/noc/noc.routes.js`
```javascript
// Defines routes
const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const nocController = require('./noc.controller');
const nocValidator = require('./noc.validator');

router.post('/noc', 
  authMiddleware.authenticate,
  nocValidator.validateCreate,
  nocController.createNOC
);

module.exports = router;
```

**File**: `app/noc/noc.validator.js`
```javascript
// Input validation
const Joi = require('joi');

exports.validateCreate = (req, res, next) => {
  const schema = Joi.object({
    applicationType: Joi.string().required(),
    projectName: Joi.string().required(),
    // ... more fields
  });
  
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
```

**File**: `app/noc/noc-application.model.js`
```javascript
// Database model
const mongoose = require('mongoose');

const nocApplicationSchema = new mongoose.Schema({
  applicationNumber: { type: String, unique: true },
  applicationType: String,
  projectName: String,
  // ... more fields
}, { timestamps: true });

module.exports = mongoose.model('NOCApplication', nocApplicationSchema);
```

## Benefits of This Structure

### ✅ Better Organization
- All related files in one place
- Easy to find and modify features
- Clear separation of concerns

### ✅ Scalability
- Add new features without touching existing code
- Independent modules can be developed in parallel
- Easy to split into microservices later

### ✅ Maintainability
- Changes isolated to specific modules
- Easier to understand codebase
- Reduced merge conflicts

### ✅ Testability
- Each module can be tested independently
- Mock services easily
- Clear dependencies

## Main Entry Point

**File**: `index.js`
```javascript
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const dbConfig = require('./app/config/db.config');
const errorMiddleware = require('./app/middleware/error.middleware');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(dbConfig.url)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./app/auth/auth.routes'));
app.use('/api/noc', require('./app/noc/noc.routes'));
app.use('/api/calculators', require('./app/calculators/calculator.routes'));
app.use('/api/water-budget', require('./app/water-budget/water-budget.routes'));
app.use('/api/rig', require('./app/rig/rig.routes'));
app.use('/api/compliance', require('./app/compliance/compliance.routes'));
app.use('/api/officer', require('./app/officer/officer.routes'));
app.use('/api/documents', require('./app/documents/document.routes'));
app.use('/api/master', require('./app/master-data/master.routes'));
app.use('/api/public', require('./app/public/public.routes'));
app.use('/api/payments', require('./app/payments/payment.routes'));

// Error handler
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

## Development Workflow

### Adding a New Feature

1. **Create Module Folder**
   ```bash
   mkdir app/new-feature
   ```

2. **Create Module Files**
   ```bash
   touch app/new-feature/new-feature.controller.js
   touch app/new-feature/new-feature.routes.js
   touch app/new-feature/new-feature.service.js
   touch app/new-feature/new-feature.validator.js
   touch app/new-feature/new-feature.model.js
   ```

3. **Implement in Order**
   - Model → Validator → Service → Controller → Routes

4. **Register Routes in `index.js`**
   ```javascript
   app.use('/api/new-feature', require('./app/new-feature/new-feature.routes'));
   ```

## Module Dependencies

```
┌─────────────────┐
│  Controllers    │ ← HTTP Layer
└────────┬────────┘
         │
┌────────▼────────┐
│   Services      │ ← Business Logic
└────────┬────────┘
         │
┌────────▼────────┐
│    Models       │ ← Data Layer
└─────────────────┘
```

**Shared Dependencies:**
- Utils (email, logger, helpers)
- Middleware (auth, validation, error)
- Config (db, jwt, constants)

This architecture is:
- ✅ Modular
- ✅ Scalable  
- ✅ Maintainable
- ✅ Testable
- ✅ Production-ready
