# Reliable Docker image build for Docker Desktop / WSL2 when parallel Bake fails with:
#   rpc error: code = Unavailable desc = error reading from server: EOF
$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))

$env:COMPOSE_BAKE = 'false'

Write-Host 'Building server image...'
docker compose build server
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Building web image...'
docker compose build web
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Starting containers...'
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Done. Web: http://localhost  API: http://localhost:4000'
