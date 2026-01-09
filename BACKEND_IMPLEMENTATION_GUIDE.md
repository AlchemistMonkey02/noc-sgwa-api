# SGWA Backend Implementation Guide

## Database Schema Design

### 1. Users Table
```sql
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    user_type ENUM('APPLICANT', 'DGO', 'RSGWA', 'ENFORCEMENT') NOT NULL,
    organization_name VARCHAR(255),
    organization_type ENUM('INDIVIDUAL', 'COMPANY', 'GOVERNMENT', 'NGO'),
    pan_number VARCHAR(10),
    gst_number VARCHAR(15),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    account_status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_user_type (user_type)
);
```

### 2. NOC Applications Table
```sql
CREATE TABLE noc_applications (
    application_id VARCHAR(50) PRIMARY KEY,
    application_number VARCHAR(100) UNIQUE NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    application_type ENUM('Fresh Application', 'NOC Renewal', 'NOC Amendment', 'NOC Transfer') NOT NULL,
    application_sub_type ENUM('Permanent', 'Temporary (Upto 3 Years)') NOT NULL,
    project_type ENUM('New', 'Expansion', 'Renovation') NOT NULL,
    water_quality_type ENUM('Fresh Water', 'Saline Water', 'Brackish Water') NOT NULL,
    ground_water_utilization ENUM('Industry', 'Mining', 'Domestic', 'Infrastructure', 'Irrigation', 'Commercial', 'Other Projects') NOT NULL,
    
    -- Project Details
    project_name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    block VARCHAR(100) NOT NULL,
    tehsil VARCHAR(100),
    village VARCHAR(100) NOT NULL,
    khasra_no VARCHAR(50),
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    assessment_unit VARCHAR(100),
    area_type ENUM('Industrial', 'Agricultural', 'Residential', 'Commercial', 'Defense', 'Mining Area'),
    project_area DECIMAL(10, 2),
    built_up_area DECIMAL(10, 2),
    
    -- Water Requirement
    daily_water_requirement DECIMAL(10, 2) NOT NULL,
    annual_water_requirement DECIMAL(12, 2),
    peak_demand DECIMAL(10, 2),
    proposed_depth DECIMAL(8, 2),
    number_of_wells INT,
    proposed_diameter DECIMAL(8, 2),
    
    -- MSME Details
    is_msme BOOLEAN DEFAULT FALSE,
    msme_type ENUM('Micro', 'Small', 'Medium'),
    msme_registration_number VARCHAR(50),
    
    -- Exemption
    is_exempt BOOLEAN DEFAULT FALSE,
    exemption_type VARCHAR(50),
    exemption_code VARCHAR(20),
    
    -- NOC Details
    existing_noc_status BOOLEAN DEFAULT FALSE,
    old_noc_no VARCHAR(50),
    date_of_commencement DATE NOT NULL,
    
    -- Block Category
    block_category ENUM('SAFE', 'SEMI_CRITICAL', 'CRITICAL', 'OVER_EXPLOITED'),
    validity_years INT,
    
    -- Application Status
    status ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'QUERY_RAISED', 'FIELD_INSPECTION', 'APPROVED', 'REJECTED', 'WITHDRAWN') DEFAULT 'SUBMITTED',
    current_stage VARCHAR(100),
    assigned_officer_id VARCHAR(50),
    priority ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM',
    
    -- Timestamps
    submitted_date TIMESTAMP NULL,
    approved_date TIMESTAMP NULL,
    rejected_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_officer_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_user (user_id),
    INDEX idx_application_number (application_number),
    INDEX idx_district_block (district, block),
    INDEX idx_submitted_date (submitted_date)
);
```

### 3. Application Extended Data Table
```sql
CREATE TABLE noc_application_extended_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL,
    
    -- Applicant Details JSON
    applicant_details JSON,
    
    -- Geological Details JSON
    geological_details JSON,
    
    -- Compliance Requirements JSON
    compliance_requirements JSON,
    
    FOREIGN KEY (application_id) REFERENCES noc_applications(application_id) ON DELETE CASCADE
);
```

### 4. Existing Structures Table
```sql
CREATE TABLE existing_structures (
    structure_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL,
    structure_type ENUM('Tubewell', 'Borewell', 'Dug Well', 'Open Well') NOT NULL,
    year_of_construction INT,
    depth DECIMAL(8, 2),
    diameter DECIMAL(6, 2),
    depth_to_water_level DECIMAL(8, 2),
    discharge DECIMAL(8, 2),
    has_meter BOOLEAN DEFAULT FALSE,
    meter_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES noc_applications(application_id) ON DELETE CASCADE,
    INDEX idx_application (application_id)
);
```

### 5. Application Documents Table
```sql
CREATE TABLE application_documents (
    document_id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by VARCHAR(50) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES noc_applications(application_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id),
    INDEX idx_application (application_id),
    INDEX idx_document_type (document_type)
);
```

### 6. Application Status History Table
```sql
CREATE TABLE application_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    stage VARCHAR(100),
    remarks TEXT,
    changed_by VARCHAR(50),
    changed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES noc_applications(application_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_application (application_id)
);
```

### 7. Application Queries Table
```sql
CREATE TABLE application_queries (
    query_id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL,
    category ENUM('TECHNICAL', 'DOCUMENT', 'COMPLIANCE', 'OTHER') NOT NULL,
    query_text TEXT NOT NULL,
    raised_by VARCHAR(50) NOT NULL,
    raised_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_text TEXT,
    responded_by VARCHAR(50),
    response_date TIMESTAMP NULL,
    status ENUM('PENDING', 'ANSWERED', 'RESOLVED') DEFAULT 'PENDING',
    
    FOREIGN KEY (application_id) REFERENCES noc_applications(application_id) ON DELETE CASCADE,
    FOREIGN KEY (raised_by) REFERENCES users(user_id),
    FOREIGN KEY (responded_by) REFERENCES users(user_id),
    INDEX idx_application (application_id),
    INDEX idx_status (status)
);
```

### 8. Rig Registry Table
```sql
CREATE TABLE rig_registry (
    rig_id VARCHAR(50) PRIMARY KEY,
    registration_no VARCHAR(100) UNIQUE NOT NULL,
    owner_id VARCHAR(50) NOT NULL,
    rig_type ENUM('DTH Rig', 'Rotary Rig', 'Cable Tool Rig', 'Percussion Rig', 'Auger Rig', 'Down-the-Hole Hammer Rig', 'Reverse Circulation Rig') NOT NULL,
    rig_mounting_type ENUM('Truck Mounted', 'Trailer Mounted', 'Skid Mounted') NOT NULL,
    rig_capacity VARCHAR(100),
    manufacturer_name VARCHAR(255),
    manufacturing_year INT,
    engine_details VARCHAR(255),
    engine_hp DECIMAL(8, 2),
    registration_date DATE NOT NULL,
    valid_from DATE NOT NULL,
    valid_upto DATE NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED') DEFAULT 'ACTIVE',
    last_inspection_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (owner_id) REFERENCES users(user_id),
    INDEX idx_registration_no (registration_no),
    INDEX idx_status (status),
    INDEX idx_owner (owner_id)
);
```

### 9. Rig Applications Table
```sql
CREATE TABLE rig_applications (
    application_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    rig_id VARCHAR(50),
    application_type ENUM('New Registration', 'Renewal', 'Amendment') NOT NULL,
    applicant_category ENUM('Drilling Agency', 'Individual', 'Organization') NOT NULL,
    
    -- Well Location Details
    state VARCHAR(100),
    district VARCHAR(100),
    block VARCHAR(100),
    village VARCHAR(100),
    khasra_no VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    proposed_depth DECIMAL(8, 2),
    proposed_diameter DECIMAL(6, 2),
    purpose_of_drilling VARCHAR(255),
    
    status ENUM('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED') DEFAULT 'SUBMITTED',
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (rig_id) REFERENCES rig_registry(rig_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_rig (rig_id),
    INDEX idx_status (status)
);
```

### 10. Rig Operation Permits Table
```sql
CREATE TABLE rig_operation_permits (
    permit_id VARCHAR(50) PRIMARY KEY,
    rig_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    operation_type ENUM('Drilling', 'Maintenance', 'Repair', 'Decommissioning') NOT NULL,
    operation_purposes JSON,
    operation_duration ENUM('1 Month', '3 Months', '6 Months', '1 Year') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Operation Location
    state VARCHAR(100),
    district VARCHAR(100),
    block VARCHAR(100),
    villages JSON,
    area_description TEXT,
    
    estimated_wells INT,
    target_depth_range VARCHAR(100),
    
    status ENUM('SUBMITTED', 'APPROVED', 'ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'SUBMITTED',
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_date TIMESTAMP NULL,
    
    FOREIGN KEY (rig_id) REFERENCES rig_registry(rig_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_rig (rig_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
);
```

### 11. NOC Certificates Table
```sql
CREATE TABLE noc_certificates (
    noc_id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL,
    noc_number VARCHAR(100) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    valid_from DATE NOT NULL,
    valid_upto DATE NOT NULL,
    approved_water_extraction DECIMAL(10, 2),
    number_of_wells INT,
    approved_depth DECIMAL(8, 2),
    approved_diameter DECIMAL(6, 2),
    conditions JSON,
    restrictions JSON,
    compliance_requirements JSON,
    certificate_path VARCHAR(500),
    qr_code VARCHAR(500),
    status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED') DEFAULT 'ACTIVE',
    issued_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES noc_applications(application_id),
    FOREIGN KEY (issued_by) REFERENCES users(user_id),
    INDEX idx_noc_number (noc_number),
    INDEX idx_application (application_id),
    INDEX idx_status (status)
);
```

### 12. Compliance Reports Table
```sql
CREATE TABLE compliance_reports (
    report_id VARCHAR(50) PRIMARY KEY,
    noc_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    reporting_period_from DATE NOT NULL,
    reporting_period_to DATE NOT NULL,
    report_type ENUM('QUARTERLY', 'ANNUAL') NOT NULL,
    
    total_water_extraction DECIMAL(12, 2),
    monthly_breakup JSON,
    peak_extraction DECIMAL(10, 2),
    
    meter_readings JSON,
    water_quality_data JSON,
    rainwater_harvesting_data JSON,
    piezometer_data JSON,
    
    status ENUM('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED') DEFAULT 'SUBMITTED',
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(50),
    review_date TIMESTAMP NULL,
    review_remarks TEXT,
    
    FOREIGN KEY (noc_id) REFERENCES noc_certificates(noc_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id),
    INDEX idx_noc (noc_id),
    INDEX idx_user (user_id),
    INDEX idx_reporting_period (reporting_period_from, reporting_period_to)
);
```

### 13. Inspections Table
```sql
CREATE TABLE inspections (
    inspection_id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50),
    noc_id VARCHAR(50),
    inspection_type ENUM('FIELD', 'DESK', 'JOINT', 'COMPLIANCE') NOT NULL,
    inspection_date DATE NOT NULL,
    inspector_id VARCHAR(50) NOT NULL,
    purpose TEXT,
    findings TEXT,
    checklist_results JSON,
    photographs JSON,
    recommendation ENUM('APPROVE', 'REJECT', 'CONDITIONAL_APPROVAL', 'REINSPECTION') NOT NULL,
    remarks TEXT,
    status ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES noc_applications(application_id) ON DELETE CASCADE,
    FOREIGN KEY (noc_id) REFERENCES noc_certificates(noc_id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_id) REFERENCES users(user_id),
    INDEX idx_application (application_id),
    INDEX idx_noc (noc_id),
    INDEX idx_inspector (inspector_id),
    INDEX idx_inspection_date (inspection_date)
);
```

### 14. Payments Table
```sql
CREATE TABLE payments (
    payment_id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50),
    user_id VARCHAR(50) NOT NULL,
    payment_type ENUM('APPLICATION_FEE', 'PROCESSING_FEE', 'ABSTRACTION_CHARGE', 'EC_CHARGE', 'PENALTY') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    gst_amount DECIMAL(10, 2),
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('ONLINE', 'DD', 'CHALLAN', 'NEFT') NOT NULL,
    transaction_id VARCHAR(100),
    payment_status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    payment_date TIMESTAMP NULL,
    receipt_number VARCHAR(100),
    receipt_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES noc_applications(application_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_application (application_id),
    INDEX idx_user (user_id),
    INDEX idx_transaction (transaction_id)
);
```

### 15. Master Data - Districts Table
```sql
CREATE TABLE master_districts (
    district_id INT AUTO_INCREMENT PRIMARY KEY,
    state VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    district_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_district (state, district_name),
    INDEX idx_state (state)
);
```

### 16. Master Data - Blocks Table
```sql
CREATE TABLE master_blocks (
    block_id INT AUTO_INCREMENT PRIMARY KEY,
    district_id INT NOT NULL,
    block_name VARCHAR(100) NOT NULL,
    block_code VARCHAR(20),
    category ENUM('SAFE', 'SEMI_CRITICAL', 'CRITICAL', 'OVER_EXPLOITED') NOT NULL,
    category_description TEXT,
    validity_years INT DEFAULT 10,
    available_resource DECIMAL(12, 2),
    current_utilization DECIMAL(12, 2),
    utilization_percentage DECIMAL(5, 2),
    restrictions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (district_id) REFERENCES master_districts(district_id),
    UNIQUE KEY unique_block (district_id, block_name),
    INDEX idx_category (category)
);
```

---

## Technology Stack Recommendations

### Backend Framework
- **Node.js + Express.js** OR **Python + FastAPI** OR **Java + Spring Boot**

### Database
- **MySQL 8.0+** or **PostgreSQL 14+** for relational data
- **MongoDB** for document storage (optional for extended JSON data)
- **Redis** for caching and session management

### File Storage
- **AWS S3** or **Azure Blob Storage** or **Local NFS** for document storage

### Authentication
- **JWT (JSON Web Tokens)** for stateless authentication
- **bcrypt** for password hashing
- **OAuth 2.0** for third-party integrations (optional)

### File Processing
- **Multer** (Node.js) or **File Upload libraries** for handling multipart uploads
- **ImageMagick** or **Sharp** for image processing
- **PDFKit** or **wkhtmltopdf** for PDF generation

### Email Service
- **SendGrid** or **AWS SES** or **SMTP** for email notifications

### SMS Service
- **Twilio** or **AWS SNS** for SMS notifications

### Payment Gateway
- **Razorpay** or **PayU** or **CCAvenue** for online payments

### Monitoring & Logging
- **Winston** or **Bunyan** for logging
- **PM2** or **Forever** for process management
- **New Relic** or **DataDog** for application monitoring

---

## API Security Best Practices

### 1. Authentication & Authorization
- Implement JWT-based authentication
- Use refresh tokens for extended sessions
- Implement role-based access control (RBAC)
- Add rate limiting to prevent brute force attacks

### 2. Input Validation
- Validate all input data on server side
- Use schema validation (Joi, Yup, etc.)
- Sanitize inputs to prevent SQL injection and XSS
- Implement CAPTCHA for sensitive operations

### 3. Data Protection
- Encrypt passwords using bcrypt (min 10 rounds)
- Use HTTPS/TLS for all communications
- Encrypt sensitive data at rest
- Implement proper CORS policies

### 4. File Upload Security
- Validate file types and sizes
- Scan uploaded files for viruses
- Store files outside web root
- Generate unique file names

### 5. API Rate Limiting
```javascript
// Example using express-rate-limit
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

app.post('/api/auth/login', loginLimiter, loginController);
```

### 6. Logging & Auditing
- Log all security-related events
- Log API access patterns
- Implement audit trail for sensitive operations
- Monitor for suspicious activities

---

## Deployment Architecture

### Development Environment
```
Frontend (React) → Backend API (Node.js/Express) → MySQL Database
     ↓                     ↓                            ↓
  Port 5173           Port 3000                    Port 3306
```

### Production Environment
```
                    Load Balancer (NGINX)
                            ↓
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
    API Server 1      API Server 2      API Server 3
        ↓                  ↓                  ↓
        └──────────────────┼──────────────────┘
                           ↓
                    Database Cluster
                    (Master-Slave)
                           ↓
                    Redis Cache
                           ↓
                    File Storage (S3)
```

### Recommended Hosting
- **AWS**: EC2, RDS, S3, CloudFront
- **Azure**: App Service, SQL Database, Blob Storage
- **Google Cloud**: Compute Engine, Cloud SQL, Cloud Storage

---

## Sample Implementation (Node.js + Express)

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── jwt.js
│   │   └── multer.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── nocController.js
│   │   ├── rigController.js
│   │   └── complianceController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── NOCApplication.js
│   │   ├── Rig.js
│   │   └── ComplianceReport.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── applications.js
│   │   ├── rigs.js
│   │   └── compliance.js
│   ├── services/
│   │   ├── emailService.js
│   │   ├── pdfService.js
│   │   └── paymentService.js
│   ├── utils/
│   │   ├── validators.js
│   │   ├── helpers.js
│   │   └── constants.js
│   └── app.js
├── tests/
├── uploads/
├── package.json
└── .env
```

### Environment Variables (.env)
```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sgwa_db
DB_USER=sgwa_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=1h
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRE=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@sgwa.rajasthan.gov.in
SMTP_PASS=email_password

# Payment Gateway
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=sgwa-documents
AWS_REGION=ap-south-1
```

---

## Testing Strategy

### Unit Tests
- Test individual functions and methods
- Mock external dependencies
- Achieve >80% code coverage

### Integration Tests
- Test API endpoints
- Test database operations
- Test external service integrations

### Load Testing
- Test API performance under load
- Identify bottlenecks
- Optimize slow queries

### Security Testing
- Penetration testing
- Vulnerability scanning
- OWASP compliance check

---

**End of Implementation Guide**
