[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$claspPath = Join-Path $repoRoot '.clasp.json'
$manifestPath = Join-Path $repoRoot 'src\appsscript.json'

if (-not (Test-Path $claspPath)) {
  throw ".clasp.json is missing at $claspPath"
}

$clasp = Get-Content -Raw $claspPath | ConvertFrom-Json
$manifest = Get-Content -Raw $manifestPath | ConvertFrom-Json
$deployments = clasp deployments 2>&1
$status = clasp status 2>&1
$hasProjectId = [bool]$clasp.projectId
$hasApiExecutable = [bool]($deployments -match 'API executable')
$hasExternalRequestScope = $manifest.oauthScopes -contains 'https://www.googleapis.com/auth/script.external_request'

$report = [ordered]@{
  scriptId = $clasp.scriptId
  parentId = $clasp.parentId
  projectId = if ($hasProjectId) { $clasp.projectId } else { '' }
  hasProjectId = $hasProjectId
  hasApiExecutableDeployment = $hasApiExecutable
  hasExternalRequestScope = $hasExternalRequestScope
  deploymentOutput = ($deployments | Out-String).Trim()
  claspStatus = ($status | Out-String).Trim()
}

$report | ConvertTo-Json -Depth 5

if (-not $hasProjectId) {
  exit 2
}

if (-not $hasApiExecutable) {
  exit 3
}

if (-not $hasExternalRequestScope) {
  exit 4
}
