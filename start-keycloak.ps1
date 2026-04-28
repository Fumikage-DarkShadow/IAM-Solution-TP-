# =====================================================================
# Bootstrap script — Keycloak via Docker for the EFREI IAM tutorial
# =====================================================================
# Usage (PowerShell, in the project folder):
#   .\start-keycloak.ps1
#
# Pre-requisites:
#   - Docker Desktop installed and running
#   - Port 8080 free on the host
# =====================================================================

$ErrorActionPreference = 'Stop'

Write-Host '=== EFREI IAM — Keycloak bootstrap ===' -ForegroundColor Magenta

# 1. Sanity check on Docker
try {
    $null = docker info --format '{{.ServerVersion}}' 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'Docker daemon is not running' }
}
catch {
    Write-Host '[ERROR] Docker is not running. Start Docker Desktop first.' -ForegroundColor Red
    exit 1
}

# 2. Stop & remove any previous container with the same name
$existing = docker ps -aq --filter 'name=^/efrei-keycloak$'
if ($existing) {
    Write-Host '[INFO] Removing previous "efrei-keycloak" container...' -ForegroundColor Yellow
    docker rm -f efrei-keycloak | Out-Null
}

# 3. Run Keycloak in development mode and import the realm at startup
$realmFile = Join-Path $PSScriptRoot 'keycloak-realm-export.json'
if (-not (Test-Path $realmFile)) {
    Write-Host "[ERROR] Realm export not found: $realmFile" -ForegroundColor Red
    exit 1
}

Write-Host '[INFO] Starting Keycloak 26.0.1 on http://localhost:8080 ...' -ForegroundColor Cyan
docker run -d `
    --name efrei-keycloak `
    -p 8080:8080 `
    -e KC_BOOTSTRAP_ADMIN_USERNAME=admin `
    -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin `
    -v "${realmFile}:/opt/keycloak/data/import/efrei-iam-realm.json:ro" `
    quay.io/keycloak/keycloak:26.0.1 `
    start-dev --import-realm | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host '[ERROR] docker run failed.' -ForegroundColor Red
    exit 1
}

Write-Host '[OK] Container started. Waiting for Keycloak to be ready (this can take ~45s)...' -ForegroundColor Green

# 4. Poll until the realm endpoint answers 200
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri 'http://localhost:8080/realms/efrei-iam/.well-known/openid-configuration' -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    }
    catch {
        # not ready yet — keep polling
    }
}

if ($ready) {
    Write-Host ''
    Write-Host '=========================================================' -ForegroundColor Green
    Write-Host ' Keycloak is READY' -ForegroundColor Green
    Write-Host '=========================================================' -ForegroundColor Green
    Write-Host ' Admin console : http://localhost:8080/admin/'
    Write-Host '   admin / admin'
    Write-Host ''
    Write-Host ' Realm         : efrei-iam'
    Write-Host ' Client        : react-spa  (public, direct access grants)'
    Write-Host ' Demo user     : demo / demo'
    Write-Host ' Other user    : ilyes / ilyes2026'
    Write-Host ''
    Write-Host ' Token endpoint:'
    Write-Host '   http://localhost:8080/realms/efrei-iam/protocol/openid-connect/token'
    Write-Host ''
    Write-Host ' Next step: cd into keycloak-jwt-spa and run "npm install" then "npm run dev"'
    Write-Host '=========================================================' -ForegroundColor Green
}
else {
    Write-Host '[WARN] Keycloak did not answer in time. Check logs with: docker logs -f efrei-keycloak' -ForegroundColor Yellow
    exit 1
}
