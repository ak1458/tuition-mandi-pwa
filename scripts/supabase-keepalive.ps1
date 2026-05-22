# Supabase keep-alive — local / Windows Task Scheduler runner.
#
# This is a thin wrapper around scripts/supabase-keepalive.mjs so you can
# run the same logic on a Windows machine without GitHub Actions.
#
# Usage (one-off):
#   $env:SUPABASE_URL = 'https://iqcnhgwrxijxylcctlsg.supabase.co'
#   $env:SUPABASE_ANON_KEY = '<anon key>'
#   pwsh ./scripts/supabase-keepalive.ps1
#
# Usage (Windows Task Scheduler, every 3 days at 2:17 AM):
#   1. Open Task Scheduler -> Create Task
#   2. Triggers -> New -> Daily, recur every 3 days, start time 02:17
#   3. Actions -> New -> Program: powershell.exe
#      Arguments: -NoProfile -ExecutionPolicy Bypass -File "D:\path\to\scripts\supabase-keepalive.ps1"
#      Start in:  D:\path\to\takhti app
#   4. Settings -> "Run task as soon as possible after a scheduled start is missed" ON

$ErrorActionPreference = 'Stop'

# Resolve project root relative to this script so it works no matter where
# Task Scheduler is run from.
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# If a .env.production.local exists, hydrate SUPABASE_URL / SUPABASE_ANON_KEY
# from it so the user does not have to set system env vars.
$EnvFile = Join-Path $ProjectRoot '.env.production.local'
if (-not $env:SUPABASE_URL -and (Test-Path $EnvFile)) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*VITE_SUPABASE_URL\s*=\s*(.+?)\s*$') {
      $env:SUPABASE_URL = $matches[1]
    }
    if ($_ -match '^\s*VITE_SUPABASE_ANON_KEY\s*=\s*(.+?)\s*$') {
      $env:SUPABASE_ANON_KEY = $matches[1]
    }
  }
}

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_ANON_KEY) {
  Write-Warning 'SUPABASE_URL or SUPABASE_ANON_KEY missing. Set them via env vars or .env.production.local before running.'
  exit 0
}

Write-Host "Pinging Supabase: $($env:SUPABASE_URL)"
node (Join-Path $ScriptDir 'supabase-keepalive.mjs')
exit $LASTEXITCODE
