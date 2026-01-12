
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    stateId = "Rajasthan"
    districtId = "Jaipur"
    blockId = "Sanganer"
    SectorType = "Industry"
    projectType = "New Project"
    waterRequirement = 50
    isWetland = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/tools/check-eligibility" -Method Post -Headers $headers -Body $body -ErrorAction Stop
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
