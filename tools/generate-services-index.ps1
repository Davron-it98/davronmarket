$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$servicesDir = Join-Path $root 'Services'
$outFile = Join-Path $servicesDir 'services.index.json'

if (-not (Test-Path -LiteralPath $servicesDir)) {
  throw "Services folder not found: $servicesDir"
}

$files = Get-ChildItem -LiteralPath $servicesDir -File -Filter '*.html' | Sort-Object Name
$items = @()

foreach ($f in $files) {
  $slug = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
  $title = (($slug -replace '[-_]+', ' ').Trim() -split ' ' | ForEach-Object {
      if ($_.Length -gt 1) {
        $_.Substring(0,1).ToUpper() + $_.Substring(1)
      } elseif ($_.Length -eq 1) {
        $_.ToUpper()
      }
    }) -join ' '

  $item = [ordered]@{
    file = $f.Name
    slug = $slug
    title = $title
    description = "Service page: $title"
    tag = 'Service'
    url = "../Services/$($f.Name)"
  }

  $items += [pscustomobject]$item
}

$payload = [ordered]@{
  generatedAt = (Get-Date).ToString('s')
  count = $items.Count
  items = $items
}

$payload | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $outFile -Encoding UTF8
Write-Host "Generated: $outFile ($($items.Count) items)"
