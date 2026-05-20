[CmdletBinding()]
param(
  [ValidateSet('workbook', 'drive', 'gmail')]
  [string]$Target = 'workbook',
  [string]$Session = 'trd-live-validation',
  [string]$Url = '',
  [switch]$StartTrace,
  [switch]$StartVideo
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$clasp = Get-Content -Raw (Join-Path $repoRoot '.clasp.json') | ConvertFrom-Json
$pwcli = 'C:\Users\abdul\.codex\scripts\Invoke-PlaywrightCli.ps1'
$outputDir = Join-Path $repoRoot 'output\playwright'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

if ($Url) {
  $url = $Url
} else {
  switch ($Target) {
    'workbook' { $url = "https://docs.google.com/spreadsheets/d/$($clasp.parentId)/edit" }
    'drive' { $url = 'https://drive.google.com/drive/u/0/my-drive' }
    'gmail' { $url = 'https://mail.google.com/mail/u/0/#drafts' }
  }
}

& $pwcli "-s=$Session" open $url --headed

if ($StartTrace) {
  & $pwcli "-s=$Session" tracing-start
}

if ($StartVideo) {
  $videoPath = Join-Path $outputDir "$Session.webm"
  & $pwcli "-s=$Session" video-start $videoPath
}

& $pwcli "-s=$Session" snapshot
