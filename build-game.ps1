#Requires -Version 5.1
<#
.SYNOPSIS
  Build Galaxy Pinball (mergegame) into a single, standalone, double-clickable HTML.

.DESCRIPTION
  Wraps `npm run build:single` in game/. Produces game/dist/galaxy-pinball.html — a
  self-contained file (JS + every PNG inlined as base64) that plays from a bare file://
  double-click, no web server needed. Canonical spec: docs/60-implementation/tech-stack.md
  (제약 / 단일 파일 배포본). On the first run it installs npm dependencies automatically.

.PARAMETER Open
  Open the built HTML in the default browser once the build finishes.

.EXAMPLE
  ./build-game.ps1

.EXAMPLE
  ./build-game.ps1 -Open

.NOTES
  Double-clicking a .ps1 opens it in Notepad by default. To run it: right-click ->
  "Run with PowerShell", or from a PowerShell prompt:
      powershell -ExecutionPolicy Bypass -File .\build-game.ps1
#>
param([switch]$Open)

$ErrorActionPreference = 'Stop'

$gameDir = Join-Path $PSScriptRoot 'game'
$output  = Join-Path $gameDir 'dist\galaxy-pinball.html'

if (-not (Test-Path (Join-Path $gameDir 'package.json'))) {
  throw "game/package.json not found next to this script. Run build-game.ps1 from the repo root."
}

Push-Location $gameDir
try {
  if (-not (Test-Path 'node_modules')) {
    Write-Host '==> Installing dependencies (first run only)...' -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed (exit $LASTEXITCODE)." }
  }

  Write-Host '==> Building single-file (npm run build:single)...' -ForegroundColor Cyan
  npm run build:single
  if ($LASTEXITCODE -ne 0) { throw "build failed (exit $LASTEXITCODE)." }

  if (-not (Test-Path $output)) { throw "build reported success but $output is missing." }

  $sizeKb = [math]::Round((Get-Item $output).Length / 1KB)
  Write-Host ''
  Write-Host "Build OK -> $output ($sizeKb KB)" -ForegroundColor Green
  Write-Host 'Double-click that file to play (no server needed).' -ForegroundColor Green

  if ($Open) { Invoke-Item $output }
}
finally {
  Pop-Location
}
