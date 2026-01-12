
$prefix = Get-Random -Minimum 1000 -Maximum 9999
$email = "dashboard_test_$prefix@example.com"
$username = "dashboard_test_$prefix"
$phone = "987650$prefix"

Write-Host "Testing with User: $email / $username"

$registerBody = @{
    applicantInfo = @{
        firstName = "Dashboard"
        lastName = "TestUser"
        emailId = $email
        mobileNumber = $phone
        title = "Mr"
        dateOfBirth = "1990-01-01"
        gender = "MALE"
        idProofType = "AADHAAR"
        idProofNumber = "123412341234"
    }
    communicationAddress = @{
        addressLine1 = "Test Address"
        state = "Rajasthan"
        district = "Jaipur"
        pincode = "302001"
    }
    loginCredentials = @{
        username = $username
        password = "Password@123"
        confirmPassword = "Password@123"
        securityQuestion = "What is your pet name?"
        securityAnswer = "Doggy"
    }
    declaration = $true
} | ConvertTo-Json -Depth 5

$headers = @{ "Content-Type" = "application/json" }

try {
    # 1. Register
    Write-Host "1. Registering..."
    $regResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Headers $headers -Body $registerBody
    Write-Host "Registration Success!" -ForegroundColor Green

    # 2. Login
    Write-Host "2. Logging in..."
    $loginBody = @{
        username = $username
        password = "Password@123"
        userType = "APPLICANT"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Headers $headers -Body $loginBody
    $token = $loginResponse.data.token
    Write-Host "Login Success! Token: $token" -ForegroundColor Green

    # 3. Get Dashboard
    Write-Host "3. Fetching Dashboard..."
    $headers.Add("Authorization", "Bearer $token")
    
    $dashResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/applications/noc/dashboard" -Method Get -Headers $headers
    Write-Host "Dashboard Response:" -ForegroundColor Green
    $dashResponse | ConvertTo-Json -Depth 10

} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errorBody" -ForegroundColor Red
    }
}
