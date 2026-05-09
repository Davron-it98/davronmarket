$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$servicesDir = Join-Path $root 'Services'
$generator = Join-Path $PSScriptRoot 'generate-services-index.ps1'

if (-not (Test-Path -LiteralPath $servicesDir)) {
  throw "Services folder not found: $servicesDir"
}
if (-not (Test-Path -LiteralPath $generator)) {
  throw "Generator script not found: $generator"
}

powershell -ExecutionPolicy Bypass -File $generator | Out-Host

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $servicesDir
$watcher.Filter = '*.html'
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents = $true

$onChange = {
  Start-Sleep -Milliseconds 250
  powershell -ExecutionPolicy Bypass -File $using:generator | Out-Host
}

Register-ObjectEvent -InputObject $watcher -EventName Created -Action $onChange | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Changed -Action $onChange | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action $onChange | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action $onChange | Out-Null

Write-Host "Watching $servicesDir for HTML changes. Press Ctrl+C to stop."
while ($true) {
  Start-Sleep -Seconds 1
}
