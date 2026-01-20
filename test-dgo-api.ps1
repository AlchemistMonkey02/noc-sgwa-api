# DGO Officer API Test Script
# PowerShell script to test all DGO endpoints

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DGO Officer API Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"

# Step 1: Login
Write-Host "`n[1/10] Logging in as DGO Officer..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            email = "dgo.jaipur@rajasthan.gov.in"
            password = "dgo123"
        } | ConvertTo-Json)
    
    $token = $loginResponse.data.token
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Test Ping
Write-Host "`n[2/10] Testing DGO Routes Health..." -ForegroundColor Yellow
try {
    $ping = Invoke-RestMethod -Uri "$baseUrl/api/officer/dgo/ping" `
        -Method GET -Headers $headers
    Write-Host "✓ Ping successful: $($ping.message)" -ForegroundColor Green
} catch {
    Write-Host "✗ Ping failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Get Dashboard Stats
Write-Host "`n[3/10] Getting Dashboard Stats..." -ForegroundColor Yellow
try {
    $dashboard = Invoke-RestMethod -Uri "$baseUrl/api/officer/dgo/dashboard" `
        -Method GET -Headers $headers
    Write-Host "✓ Dashboard loaded" -ForegroundColor Green
    Write-Host "  - Total Applications: $($dashboard.data.stats.totalApplications)" -ForegroundColor Gray
    Write-Host "  - Pending Review: $($dashboard.data.stats.pendingReview)" -ForegroundColor Gray
    Write-Host "  - Approved: $($dashboard.data.stats.approved)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Dashboard failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Get Applications
Write-Host "`n[4/10] Getting Applications List..." -ForegroundColor Yellow
try {
    $apps = Invoke-RestMethod -Uri "$baseUrl/api/officer/dgo/applications" `
        -Method GET -Headers $headers
    
    $appCount = 0
    if ($apps.data.applications) {
        $appCount = $apps.data.applications.Count
    }
    
    Write-Host "✓ Found $appCount applications" -ForegroundColor Green
    
    if ($appCount -gt 0) {
        $testApp = $apps.data.applications[0]
        Write-Host "  First Application:" -ForegroundColor Gray
        Write-Host "    - ID: $($testApp.applicationId)" -ForegroundColor Gray
        Write-Host "    - Number: $($testApp.applicationNumber)" -ForegroundColor Gray
        Write-Host "    - Status: $($testApp.status)" -ForegroundColor Gray
        
        # Save for later tests
        $APP_ID = $testApp.applicationId
    } else {
        Write-Host "  (No applications found - some tests will be skipped)" -ForegroundColor Yellow
        $APP_ID = $null
    }
} catch {
    Write-Host "✗ Get applications failed: $($_.Exception.Message)" -ForegroundColor Red
    $APP_ID = $null
}

# Step 5: Get Application Details (if we have an app)
if ($APP_ID) {
    Write-Host "`n[5/10] Getting Application Details ($APP_ID)..." -ForegroundColor Yellow
    try {
        $appDetails = Invoke-RestMethod -Uri "$baseUrl/api/officer/dgo/applications/$APP_ID" `
            -Method GET -Headers $headers
        Write-Host "✓ Application details retrieved" -ForegroundColor Green
        Write-Host "  - Applicant: $($appDetails.data.projectDetails.applicantName)" -ForegroundColor Gray
        Write-Host "  - Project: $($appDetails.data.projectDetails.projectName)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Get details failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "`n[5/10] Skipping Application Details (no apps available)" -ForegroundColor Yellow
}

# Step 6: Verify Documents (if we have an app)
if ($APP_ID) {
    Write-Host "`n[6/10] Testing Document Verification..." -ForegroundColor Yellow
    try {
        $verifyBody = @{
            documentsVerified = $true
            remarks = "TEST: All documents verified"
            verifiedDocuments = @("LAND_OWNERSHIP_PROOF", "PROJECT_PROPOSAL")
            missingDocuments = @()
        } | ConvertTo-Json
        
        $verifyResult = Invoke-RestMethod -Uri "$baseUrl/api/officer/dgo/applications/$APP_ID/verify-documents" `
            -Method POST -Headers $headers -Body $verifyBody
        Write-Host "✓ Documents verified successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Document verification failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "`n[6/10] Skipping Document Verification (no apps available)" -ForegroundColor Yellow
}

# Step 7: Get Queries
Write-Host "`n[7/10] Getting Queries List..." -ForegroundColor Yellow
try {
    $queries = Invoke-RestMethod -Uri "$baseUrl/api/officer/dgo/queries" `
        -Method GET -Headers $headers
    
    $queryCount = 0
    if ($queries.data -and $queries.data.Length) {
        $queryCount = $queries.data.Length
    }
    
    Write-Host "✓ Found $queryCount queries" -ForegroundColor Green
} catch {
    Write-Host "✗ Get queries failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 8: Raise Query (if we have an app)
if ($APP_ID) {
    Write-Host "`n[8/10] Testing Raise Query..." -ForegroundColor Yellow
    try {
        $queryBody = @{
            subject = "TEST: Water Requirement Clarification"
            question = "Please provide detailed breakdown of water consumption"
            category = "TECHNICAL"
            deadline = "2026-02-15"
        } | ConvertTo-Json
        
        $queryResult = Invoke-RestMethod -Uri "$baseUrl/api/officer/dgo/applications/$APP_ID/query" `
            -Method POST -Headers $headers -Body $queryBody
        Write-Host "✓ Query raised successfully" -ForegroundColor Green
        Write-Host "  - Query ID: $($queryResult.data.queryId)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Raise query failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "`n[8/10] Skipping Raise Query (no apps available)" -ForegroundColor Yellow
}

# Step 9: Schedule Inspection (if we have an app)
if ($APP_ID) {
    Write-Host "`n[9/10] Testing Schedule Inspection..." -ForegroundColor Yellow
    try {
        $inspectionBody = @{
            inspectionDate = "2026-02-05"
            inspectorId = "INSPECTOR_001"
            purpose = "TEST: Site verification"
            checkpoints = @("Verify location", "Check documents")
        } | ConvertTo-Json
        
        $inspectionResult = Invoke-RestMethod -Uri "$baseUrl/api/officer/dgo/applications/$APP_ID/schedule-inspection" `
            -Method POST -Headers $headers -Body $inspectionBody
        Write-Host "✓ Inspection scheduled successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Schedule inspection failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "`n[9/10] Skipping Schedule Inspection (no apps available)" -ForegroundColor Yellow
}

# Step 10: Get Compliance Report
Write-Host "`n[10/10] Testing Compliance Report..." -ForegroundColor Yellow
try {
    $report = Invoke-RestMethod -Uri "$baseUrl/api/officer/dgo/compliance-report?fromDate=2026-01-01" `
        -Method GET -Headers $headers
    Write-Host "✓ Compliance report retrieved" -ForegroundColor Green
} catch {
    Write-Host "✗ Compliance report failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNote: Some tests may have been skipped if no applications exist in the database." -ForegroundColor Yellow
Write-Host "Run the seeder to create test data: npm run seed" -ForegroundColor Yellow
