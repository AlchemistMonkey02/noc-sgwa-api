
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_TEST_TOKEN" # User will need to replace this or we login first
}

# Login to get token
$loginBody = @{
    username = "applicant@test.com"
    password = "Password@123"
    userType = "APPLICANT"
} | ConvertTo-Json

try {
    Write-Host "Logging in..."
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body $loginBody
    $token = $loginResponse.data.token
    Write-Host "Login Successful. Token obtained."
    
    $headers.Authorization = "Bearer $token"

    Write-Host "Fetching Dashboard Data..."
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/applications/noc/dashboard" -Method Get -Headers $headers
    
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errorBody" -ForegroundColor Red
    }
}
