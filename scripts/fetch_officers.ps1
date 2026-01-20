$url = "http://localhost:5000/api/officer/dgo/officers?role=INSPECTION_OFFICER"
$token = "YOUR_TOKEN_HERE" # User must replace this, but even without it, we check status.

Write-Host "Testing URL: $url"
try {
    $response = Invoke-WebRequest -Uri $url -Method Get -Headers @{ "Authorization" = "Bearer $token" } -ErrorAction Stop
    Write-Host "Success: $($response.StatusCode)"
    Write-Host $response.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Body: $($reader.ReadToEnd())"
    }
}
