# =====================================================================
# Reproduces the curl from slide 397:
#   curl -X POST .../token -H "Content-Type: application/x-www-form-urlencoded"
#        -d client_id=... -d username=... -d password=... -d grant_type=password
# Outputs the access_token, decodes the payload and prints it as a table.
# =====================================================================
param(
    [string]$Username = 'demo',
    [string]$Password = 'demo',
    [string]$ClientId = 'react-spa',
    [string]$Realm = 'efrei-iam',
    [string]$ServerUrl = 'http://localhost:8080'
)

$tokenEndpoint = "$ServerUrl/realms/$Realm/protocol/openid-connect/token"

Write-Host "POST $tokenEndpoint" -ForegroundColor Cyan

$body = @{
    client_id  = $ClientId
    username   = $Username
    password   = $Password
    grant_type = 'password'
    scope      = 'openid profile email'
}

try {
    $response = Invoke-RestMethod -Uri $tokenEndpoint -Method Post -Body $body -ContentType 'application/x-www-form-urlencoded'
}
catch {
    Write-Host "[ERROR] Token request failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host '=== Tokens received ===' -ForegroundColor Green
Write-Host "access_token  (truncated) : $($response.access_token.Substring(0,60))..."
Write-Host "refresh_token (truncated) : $($response.refresh_token.Substring(0,60))..."
Write-Host "id_token      (truncated) : $($response.id_token.Substring(0,60))..."
Write-Host "expires_in                 : $($response.expires_in) s"
Write-Host "token_type                 : $($response.token_type)"
Write-Host ''

# Decode the JWT payload (middle part) for display
function ConvertFrom-JwtPayload {
    param([string]$Token)
    $payload = $Token.Split('.')[1]
    # base64url -> base64
    $payload = $payload.Replace('-', '+').Replace('_', '/')
    switch ($payload.Length % 4) {
        2 { $payload += '==' }
        3 { $payload += '=' }
    }
    $bytes = [Convert]::FromBase64String($payload)
    $json = [System.Text.Encoding]::UTF8.GetString($bytes)
    return $json | ConvertFrom-Json
}

$decoded = ConvertFrom-JwtPayload -Token $response.access_token

Write-Host '=== Decoded JWT payload ===' -ForegroundColor Green
$decoded | Format-List

Write-Host ''
Write-Host '=== Full access_token (paste in https://www.jwt.io) ===' -ForegroundColor Yellow
Write-Host $response.access_token
