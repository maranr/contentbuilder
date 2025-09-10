$port = 3000
try {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (-not $conns) {
    Write-Host "No process is listening on port $port" -ForegroundColor Yellow
    exit 0
  }
  $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($pid in $pids) {
    try {
      Stop-Process -Id $pid -Force -ErrorAction Stop
      Write-Host "Killed PID $pid on port $port" -ForegroundColor Green
    } catch {
      Write-Host "Failed to kill PID $pid: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
} catch {
  Write-Host "Error checking port $port: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

