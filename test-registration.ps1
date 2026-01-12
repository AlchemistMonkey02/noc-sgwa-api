# Test-RegistrationFlow.ps1
$baseUrl = "http://localhost:3000/api"

Write-Host "Please ensure the server is running on http://localhost:3000" -ForegroundColor Yellow

# 1. Get ID Proof Types
Write-Host "`n1. Testing Get ID Proof Types..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/master/id-proof-types" -Method Get
    Write-Host "Success! Found $($response.count) ID proof types." -ForegroundColor Green
    $response.data | Format-Table type, label, pattern -AutoSize
} catch {
    Write-Host "Failed to get ID proof types: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Validate Step 1 (Applicant Info)
Write-Host "`n2. Testing Validate Step 1 (Applicant Info)..." -ForegroundColor Cyan
$step1Data = @{
    step = 1
    data = @{
        title = "Mr"
        applicantName = "Test User"
        dateOfBirth = "1990-01-01"
        gender = "MALE"
        idProofType = "PAN"
        idProofNumber = "ABCDE1234F"
        mobileNumber = "9876543210"
        emailId = "test@example.com"
    }
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register/validate-step" -Method Post -Body $step1Data -ContentType "application/json"
    Write-Host "Step 1 Validation Success: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "Step 1 Validation Failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Response | Select-Object -ExpandProperty StatusCode
}


# 3. Validate Step 2 (Address)
Write-Host "`n3. Testing Validate Step 2 (Address)..." -ForegroundColor Cyan
$step2Data = @{
    step = 2
    data = @{
        addressLine1 = "123 Test Street"
        state = "Rajasthan"
        district = "Jaipur"
        pincode = "302001"
    }
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register/validate-step" -Method Post -Body $step2Data -ContentType "application/json"
    Write-Host "Step 2 Validation Success: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "Step 2 Validation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Validate Step 3 (Credentials - Invalid Password)
Write-Host "`n4. Testing Validate Step 3 (Start with Invalid Password)..." -ForegroundColor Cyan
$step3Invalid = @{
    step = 3
    data = @{
        preferredUsername = "testuser123"
        password = "123" # Too short
        confirmPassword = "123"
    }
} | ConvertTo-Json -Depth 5

try {
    Invoke-RestMethod -Uri "$baseUrl/auth/register/validate-step" -Method Post -Body $step3Invalid -ContentType "application/json"
    Write-Host "Unexpected Success (Should fail)" -ForegroundColor Red
} catch {
    Write-Host "Validation Failed as Expected (Password too short)" -ForegroundColor Green
}

# 5. Validate Step 3 (Credentials - Valid)
Write-Host "`n5. Testing Validate Step 3 (Valid)..." -ForegroundColor Cyan
$step3Valid = @{
    step = 3
    data = @{
        preferredUsername = "testuser123"
        password = "SecurePass@123"
        confirmPassword = "SecurePass@123"
        securityQuestion = "Pet"
        securityAnswer = "Buddy"
    }
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register/validate-step" -Method Post -Body $step3Valid -ContentType "application/json"
    Write-Host "Step 3 Validation Success: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "Step 3 Validation Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTesting Complete!" -ForegroundColor Yellow
