<#
PowerShell helper to attempt resolving common Windows `esbuild.exe` file-lock issues

Usage (run from a PowerShell prompt as Administrator if necessary):
  cd <repo>/frontend
  .\scripts\fix-windows-esbuild.ps1

What it does (best-effort):
- Stops common node processes that might hold file handles (node, yarn, pnpm)
- Tries to rename an existing esbuild binary so `npm ci` can replace it
- Runs `npm ci` in the frontend folder

Notes:
- This script is best-run from an elevated Administrator PowerShell if you keep hitting EPERM.
- If an antivirus or other process keeps locking the file, you may need to exclude the repo directory from scanning or temporarily disable the tool.
- If this script cannot rename/delete the file due to permission errors, consider restarting the machine and running this script before opening editors.
#>

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Write-Host "Running fix script in: $root" -ForegroundColor Cyan

# Stop common processes that may lock native binaries
$procsToKill = @('node', 'node.exe', 'yarn', 'pnpm')
foreach ($p in $procsToKill) {
  try {
    Get-Process -Name $p -ErrorAction SilentlyContinue | ForEach-Object {
      Write-Host "Stopping process: $($_.ProcessName) (Id=$($_.Id))" -ForegroundColor Yellow
      Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
  } catch {
    # ignore
  }
}

Start-Sleep -Milliseconds 500

# Try to rename the esbuild binary if it exists
$esbuildPath = Join-Path $root 'node_modules\@esbuild\win32-x64\esbuild.exe'
$esbuildLocked = $esbuildPath + '.locked'

if (Test-Path $esbuildPath) {
  try {
    Write-Host "Found esbuild at: $esbuildPath" -ForegroundColor Green
    if (Test-Path $esbuildLocked) {
      Write-Host "Found existing locked file: $esbuildLocked - attempting to remove it first" -ForegroundColor Yellow
      Remove-Item -Path $esbuildLocked -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Attempting to rename esbuild.exe -> esbuild.exe.locked" -ForegroundColor Yellow
    Rename-Item -Path $esbuildPath -NewName 'esbuild.exe.locked' -Force
    Write-Host "Renamed esbuild successfully." -ForegroundColor Green
  } catch {
    Write-Host "Failed to rename esbuild: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run PowerShell as Administrator or close programs that are locking the file." -ForegroundColor Red
  }
} else {
  Write-Host "No esbuild.exe found at: $esbuildPath (ok)" -ForegroundColor Green
}

# Run npm ci to reinstall deps
try {
  Write-Host "Running: npm ci" -ForegroundColor Cyan
  Push-Location $root
  & npm ci
  Pop-Location
  Write-Host "npm ci completed. You can now re-run the orchestrator: node ./scripts/run-e2e.js --skip-install" -ForegroundColor Green
} catch {
  Write-Host "npm ci failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "If npm ci still fails with EPERM on esbuild, try rebooting and running this script immediately before opening editors, or run PowerShell as Administrator." -ForegroundColor Yellow
}
<#
PowerShell helper to attempt resolving common Windows `esbuild.exe` file-lock issues

Usage (run from a PowerShell prompt as Administrator if necessary):
  cd <repo>/frontend
  .\scripts\fix-windows-esbuild.ps1

What it does (best-effort):
- Stops common node processes that might hold file handles (node, yarn, pnpm)
- Tries to rename an existing esbuild binary so `npm ci` can replace it
- Runs `npm ci` in the frontend folder

Notes:
- This script is best-run from an elevated Administrator PowerShell if you keep hitting EPERM.
- If an antivirus or other process keeps locking the file, you may need to exclude the repo directory from scanning or temporarily disable the tool.
- If this script cannot rename/delete the file due to permission errors, consider restarting the machine and running this script before opening editors.
#>

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Write-Host "Running fix script in: $root" -ForegroundColor Cyan

# Stop common processes that may lock native binaries
$procsToKill = @('node', 'node.exe', 'yarn', 'pnpm')
foreach ($p in $procsToKill) {
  try {
    Get-Process -Name $p -ErrorAction SilentlyContinue | ForEach-Object {
      Write-Host "Stopping process: $($_.ProcessName) (Id=$($_.Id))" -ForegroundColor Yellow
      Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
  } catch {
    # ignore
  }
}

Start-Sleep -Milliseconds 500

# Try to rename the esbuild binary if it exists
$esbuildPath = Join-Path $root 'node_modules\@esbuild\win32-x64\esbuild.exe'
$esbuildLocked = $esbuildPath + '.locked'

if (Test-Path $esbuildPath) {
  try {
    Write-Host "Found esbuild at: $esbuildPath" -ForegroundColor Green
    if (Test-Path $esbuildLocked) {
      Write-Host "Found existing locked file: $esbuildLocked - attempting to remove it first" -ForegroundColor Yellow
      Remove-Item -Path $esbuildLocked -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Attempting to rename esbuild.exe -> esbuild.exe.locked" -ForegroundColor Yellow
    Rename-Item -Path $esbuildPath -NewName 'esbuild.exe.locked' -Force
    Write-Host "Renamed esbuild successfully." -ForegroundColor Green
  } catch {
    Write-Host "Failed to rename esbuild: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run PowerShell as Administrator or close programs that are locking the file." -ForegroundColor Red
  }
} else {
  Write-Host "No esbuild.exe found at: $esbuildPath (ok)" -ForegroundColor Green
}

# Run npm ci to reinstall deps
try {
  Write-Host "Running: npm ci" -ForegroundColor Cyan
  Push-Location $root
  & npm ci
  Pop-Location
  Write-Host "npm ci completed. You can now re-run the orchestrator: node ./scripts/run-e2e.js --skip-install" -ForegroundColor Green
} catch {
  Write-Host "npm ci failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "If npm ci still fails with EPERM on esbuild, try rebooting and running this script immediately before opening editors, or run PowerShell as Administrator." -ForegroundColor Yellow
}
