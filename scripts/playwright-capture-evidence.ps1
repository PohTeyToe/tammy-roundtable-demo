[CmdletBinding()]
param(
  [string]$Session = 'trd-live-validation',
  [switch]$StopTrace,
  [switch]$StopVideo
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$pwcli = 'C:\Users\abdul\.codex\scripts\Invoke-PlaywrightCli.ps1'
$outputDir = Join-Path $repoRoot 'output\playwright'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

Push-Location $outputDir
try {
  & $pwcli "-s=$Session" screenshot
  if ($StopTrace) {
    & $pwcli "-s=$Session" tracing-stop
  }
  if ($StopVideo) {
    & $pwcli "-s=$Session" video-stop
  }
} finally {
  Pop-Location
}
