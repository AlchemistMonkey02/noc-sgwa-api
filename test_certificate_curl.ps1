# PowerShell Script to Test NOC Certificate APIs
# Usage: ./test_certificate_api.ps1

$baseUrl = "http://127.0.0.1:3000/api"
$username = "applicant@test.com"
$password = "Password@123"

# 1. Login to get Token
Write-Host "1. Logging in as $username..." -ForegroundColor Cyan
$loginBody = @{
    username = $username
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "   Login Successful. Token received." -ForegroundColor Green
}
catch {
    Write-Host "   Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 2. Get User Applications to find an Application ID
Write-Host "`n2. Fetching User Applications to find a valid ID..." -ForegroundColor Cyan
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $appsResponse = Invoke-RestMethod -Uri "$baseUrl/applications/noc" -Method Get -Headers $headers
    $apps = $appsResponse.data.applications

    if ($apps.Count -eq 0) {
        Write-Host "   No applications found for this user. Cannot test certificate." -ForegroundColor Yellow
        exit
    }

    $appId = $apps[0].applicationId
    # Or manually set ID here if needed
    # $appId = "YOUR_MANUAL_APP_ID" 

    Write-Host "   Using Application ID: $appId" -ForegroundColor Green
    
    # Check if this app has a certificate
    if (-not $apps[0].nocCertificateId) {
        Write-Host "   WARNING: This application does not seem to have a certificate issued yet (nocCertificateId is null)." -ForegroundColor Yellow
        Write-Host "   The API calls below might return 404 CERTIFICATE_NOT_FOUND." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   Failed to fetch applications: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 3. View Certificate Details
Write-Host "`n3. Testing View Certificate API..." -ForegroundColor Cyan
Write-Host "   GET $baseUrl/applications/noc/$appId/certificate" -ForegroundColor Gray

try {
    $certResponse = Invoke-RestMethod -Uri "$baseUrl/applications/noc/$appId/certificate" -Method Get -Headers $headers
    Write-Host "   Success!" -ForegroundColor Green
    Write-Host "   NOC Number: $($certResponse.data.nocNumber)"
    Write-Host "   Valid Upto: $($certResponse.data.validUpto)"
}
catch {
    Write-Host "   Request Failed: $($_.Exception.Message)" -ForegroundColor Red
    # PS often hides the body on error, try to read stream if possible, or just look at status
}

# 4. Download Certificate PDF
Write-Host "`n4. Testing Download Certificate API..." -ForegroundColor Cyan
Write-Host "   GET $baseUrl/applications/noc/$appId/certificate/download" -ForegroundColor Gray
$outputFile = "NOC_Certificate_$appId.pdf"

try {
    Invoke-RestMethod -Uri "$baseUrl/applications/noc/$appId/certificate/download" -Method Get -Headers $headers -OutFile $outputFile
    Write-Host "   Success! File saved to: $outputFile" -ForegroundColor Green
}
catch {
    Write-Host "   Download Failed: $($_.Exception.Message)" -ForegroundColor Red
}
