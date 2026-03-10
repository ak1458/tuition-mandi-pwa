$ErrorActionPreference = "Stop"

$port = 5173
$proc = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev:host" -PassThru -WindowStyle Hidden

try {
  Start-Sleep -Seconds 8
  $url = "http://127.0.0.1:$port"
  $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
  Write-Host "Local server response code: $($response.StatusCode)"
  Write-Host "Local server test passed at $url"
}
finally {
  if ($proc -and !$proc.HasExited) {
    Stop-Process -Id $proc.Id -Force
  }
}
