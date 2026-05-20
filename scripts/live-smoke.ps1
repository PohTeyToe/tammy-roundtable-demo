[CmdletBinding()]
param(
  [string]$TransactionId = 'RT-LIVE-1002',
  [switch]$SkipPush,
  [switch]$SkipSeed,
  [switch]$UseHappyPath
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot

try {
  if (-not $SkipPush) {
    clasp push --force
  }

  clasp run setupDemoEnvironment

  if (-not $SkipSeed) {
    clasp run seedDemoData
  }

  if ($UseHappyPath) {
    clasp run runHappyPathByTransactionId --params "[`"$TransactionId`"]"
  } else {
    clasp run runExtractionByTransactionId --params "[`"$TransactionId`"]"
    clasp run approveReviewByTransactionId --params "[`"$TransactionId`"]"
    clasp run generateDraftByTransactionId --params "[`"$TransactionId`"]"
  }
} finally {
  Pop-Location
}
