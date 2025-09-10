$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repo
$nodePath = Join-Path $repo ".tools\node\node-v20.18.0-win-x64"
if (-Not (Test-Path $nodePath)) {
  Write-Host "Portable Node not found at $nodePath" -ForegroundColor Yellow
}
$env:Path = "$nodePath;$env:Path"
Write-Host "Node: $(node -v) | npm: $(npm -v)" -ForegroundColor Cyan
& "$nodePath\npm.cmd" run --workspace web dev

