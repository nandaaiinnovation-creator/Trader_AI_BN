# Cleanup helper: remove generated artifacts and optionally untrack them from git
# Usage: Run from repository root: `.rontend\scripts\cleanup-repo.ps1`

$paths = @(
  'frontend\dist',
  'frontend\coverage',
  'frontend\e2e-artifacts',
  'frontend\tmp-logs'
)

Write-Output "The following paths will be removed (if present):"
$paths | ForEach-Object { Write-Output " - $_" }

foreach ($p in $paths){
  if (Test-Path $p){
    Write-Output "Removing $p"
    Remove-Item -Recurse -Force $p
  }
}

Write-Output "If any of these were accidentally committed, run the following commands to untrack and commit the .gitignore update:"
Write-Output "git rm -r --cached frontend/dist frontend/coverage frontend/e2e-artifacts frontend/tmp-logs"
Write-Output "git add .gitignore && git commit -m 'chore: ignore generated artifacts (dist, coverage, e2e-artifacts, tmp-logs)'"

Write-Output "Done."
