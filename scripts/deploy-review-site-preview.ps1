param()

$ErrorActionPreference = 'Stop'
if ($null -ne (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue)) {
  $PSNativeCommandUseErrorActionPreference = $false
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$distPath = Join-Path $projectRoot 'dist\review-site'
$fallbackScriptWindows = 'C:\Users\abdul\.agents\skills\deploy-to-vercel\resources\deploy-codex.sh'
$fallbackScriptBash = '/mnt/c/Users/abdul/.agents/skills/deploy-to-vercel/resources/deploy-codex.sh'
$vercelCommand = (Get-Command vercel.cmd -ErrorAction SilentlyContinue).Source

if (-not $vercelCommand) {
  $vercelCommand = (Get-Command vercel -ErrorAction SilentlyContinue).Source
}

function Get-VercelToken {
  $token = [Environment]::GetEnvironmentVariable('VERCEL_TOKEN', 'Process')
  if (-not $token) {
    $token = [Environment]::GetEnvironmentVariable('VERCEL_TOKEN', 'User')
  }
  if (-not $token) {
    $token = [Environment]::GetEnvironmentVariable('VERCEL_TOKEN', 'Machine')
  }
  return $token
}

function Invoke-VercelCapture {
  param(
    [string]$Command,
    [string[]]$Arguments
  )

  $stdoutPath = Join-Path $env:TEMP ('vercel-' + [guid]::NewGuid().ToString() + '.out.txt')
  $stderrPath = Join-Path $env:TEMP ('vercel-' + [guid]::NewGuid().ToString() + '.err.txt')
  $quotedArgs = $Arguments | ForEach-Object { '"' + ($_ -replace '"', '\"') + '"' }
  $cmdLine = '"' + $Command + '" ' + ($quotedArgs -join ' ') + ' 1> "' + $stdoutPath + '" 2> "' + $stderrPath + '"'

  try {
    & cmd.exe /d /c $cmdLine | Out-Null
    return @{
      ExitCode = $LASTEXITCODE
      StdOut = if (Test-Path $stdoutPath) { Get-Content -Raw $stdoutPath } else { '' }
      StdErr = if (Test-Path $stderrPath) { Get-Content -Raw $stderrPath } else { '' }
    }
  } finally {
    if (Test-Path $stdoutPath) {
      Remove-Item $stdoutPath -Force
    }
    if (Test-Path $stderrPath) {
      Remove-Item $stderrPath -Force
    }
  }
}

function Get-VercelScope {
  param(
    [string]$Command,
    [string]$Token
  )

  $projectConfigPath = Join-Path $projectRoot '.vercel\project.json'
  $repoConfigPath = Join-Path $projectRoot '.vercel\repo.json'

  if (Test-Path $projectConfigPath) {
    $projectConfig = Get-Content -Raw $projectConfigPath | ConvertFrom-Json
    if ($projectConfig.orgId) {
      return $projectConfig.orgId
    }
  }

  if (Test-Path $repoConfigPath) {
    $repoConfig = Get-Content -Raw $repoConfigPath | ConvertFrom-Json
    if ($repoConfig.orgId) {
      return $repoConfig.orgId
    }
  }

  if (-not $Token) {
    return $null
  }

  $teamsResult = Invoke-VercelCapture -Command $Command -Arguments @('teams', 'list', '--format', 'json', '--token', $Token)
  if ($teamsResult.ExitCode -ne 0 -or -not $teamsResult.StdOut) {
    return $null
  }

  $teamsPayload = $teamsResult.StdOut | ConvertFrom-Json
  if ($teamsPayload.teams.Count -eq 1) {
    return $teamsPayload.teams[0].slug
  }

  return $null
}

Push-Location $projectRoot
try {
  node .\scripts\build-review-site.mjs | Out-Host

  if (-not (Test-Path $distPath)) {
    throw "Built review site missing at $distPath"
  }

  $vercelIdentity = $null
  $vercelToken = Get-VercelToken
  $vercelScope = $null

  if ($vercelCommand -and $vercelToken) {
    $identityResult = Invoke-VercelCapture -Command $vercelCommand -Arguments @('whoami', '--token', $vercelToken)
    if ($identityResult.ExitCode -eq 0 -and $identityResult.StdOut) {
      $vercelIdentity = ($identityResult.StdOut -split "`r?`n" | Where-Object { $_ } | Select-Object -First 1)
    }
    if ($vercelIdentity) {
      $vercelScope = Get-VercelScope -Command $vercelCommand -Token $vercelToken
    }
  } elseif ($vercelCommand) {
    $cmdLine = '"' + $vercelCommand + '" whoami 1> "%TEMP%\\vercel-whoami.txt" 2>nul'
    & cmd.exe /c $cmdLine | Out-Null
    if ($LASTEXITCODE -eq 0 -and (Test-Path "$env:TEMP\\vercel-whoami.txt")) {
      $vercelIdentity = (Get-Content "$env:TEMP\\vercel-whoami.txt" -ErrorAction SilentlyContinue | Select-Object -First 1)
    }
  }

  if ($vercelIdentity) {
    Write-Host "Vercel CLI authenticated as $vercelIdentity"
    $deployArgs = @('deploy', $projectRoot, '-y', '--no-wait', '--target', 'preview')
    if ($vercelToken) {
      $deployArgs += @('--token', $vercelToken)
    }
    if ($vercelScope) {
      $deployArgs += @('--scope', $vercelScope)
      Write-Host "Using Vercel scope $vercelScope"
    }
    $quotedArgs = $deployArgs | ForEach-Object { '"' + ($_ -replace '"', '\"') + '"' }
    $cmdLine = '"' + $vercelCommand + '" ' + ($quotedArgs -join ' ')
    & cmd.exe /d /c $cmdLine
    exit $LASTEXITCODE
  }

  if (-not (Test-Path $fallbackScriptWindows)) {
    throw "Fallback deploy script missing at $fallbackScriptWindows"
  }

  Write-Host 'Vercel CLI is not authenticated. Using claimable preview deploy fallback...'
  $bashDistPath = '/mnt/' + (($distPath.Substring(0,1).ToLower()) + $distPath.Substring(2) -replace '\\', '/')
  $deployLog = Join-Path $env:TEMP 'tammy-review-site-deploy.log'
  if (Test-Path $deployLog) {
    Remove-Item $deployLog -Force
  }
  $cmdLine = 'bash "' + $fallbackScriptBash + '" "' + $bashDistPath + '" > "' + $deployLog + '" 2>&1'
  & cmd.exe /c $cmdLine | Out-Null
  $deployOutput = if (Test-Path $deployLog) { Get-Content $deployLog -Raw } else { '' }

  if ($LASTEXITCODE -eq 0) {
    Write-Host $deployOutput
    exit 0
  }

  if ($deployOutput -match 'recommended way to deploy is now via the Vercel CLI') {
    throw 'Claimable fallback deploy is no longer available. Run `vercel login` once in this repo, then rerun `npm run deploy:review-site`.'
  }

  if ($deployOutput -match 'Preparing deployment' -and $deployOutput -match 'Deploying' -and $deployOutput -notmatch 'previewUrl') {
    throw 'Preview deploy could not complete without Vercel authentication on this machine. Run `vercel login`, then rerun `npm run deploy:review-site`.'
  }

  throw $deployOutput.Trim()
}
finally {
  Pop-Location
}
