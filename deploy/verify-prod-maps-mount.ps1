$composePath = Join-Path $PSScriptRoot '..\docker-compose.prod.yml'
$composeText = Get-Content $composePath -Raw

$forbiddenMount = './database/maps:/app/database/maps:ro'

if ($composeText -match [regex]::Escape($forbiddenMount)) {
  Write-Error "Forbidden production mount detected: $forbiddenMount"
  exit 1
}

Write-Output 'Production compose does not override bundled backend maps.'
