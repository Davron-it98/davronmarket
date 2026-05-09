$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$generator = Join-Path $PSScriptRoot 'generate-news-index.ps1'

if (-not (Test-Path -LiteralPath $generator)) {
  throw "Generator script not found: $generator"
}

powershell -ExecutionPolicy Bypass -File $generator | Out-Host

$watchPaths = @($root, (Join-Path $root 'Services')) | Select-Object -Unique
$watchers = @()
$events = @()

$onChange = {
  Start-Sleep -Milliseconds 300
  powershell -ExecutionPolicy Bypass -File $using:generator | Out-Host
}

foreach ($path in $watchPaths) {
  if (-not (Test-Path -LiteralPath $path)) { continue }

  $watcher = New-Object System.IO.FileSystemWatcher
  $watcher.Path = $path
  $watcher.Filter = '*.html'
  $watcher.IncludeSubdirectories = $true
  $watcher.EnableRaisingEvents = $true

  $watchers += $watcher
  $events += Register-ObjectEvent -InputObject $watcher -EventName Created -Action $onChange
  $events += Register-ObjectEvent -InputObject $watcher -EventName Changed -Action $onChange
  $events += Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action $onChange
  $events += Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action $onChange
}

Write-Host "Watching HTML pages for changes. Press Ctrl+C to stop."
while ($true) {
  Start-Sleep -Seconds 1
}
