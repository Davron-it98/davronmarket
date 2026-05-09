$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'assets\data'
$outFile = Join-Path $outDir 'news.index.json'

if (-not (Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$excludeDirs = @(
  '\assets\',
  '\tools\',
  '\wordpress-plugin\',
  '\Panel\',
  '\Course\',
  '\File\'
)

$excludeFiles = @(
  'index.html',
  'news.html',
  'admin.html',
  'owner.html',
  'panel.html',
  'login.html',
  'register.html'
)

function ConvertTo-Slug([string]$name) {
  $base = ($name.ToLower() -replace '[^a-z0-9]+', '-')
  return ($base -replace '(^-+|-+$)', '')
}

function Get-Category([string]$relPath, [string]$title, [string]$name) {
  $hay = ($relPath + ' ' + $title + ' ' + $name).ToLower()
  if ($hay -match 'shop') { return 'shop' }
  if ($hay -match 'servis|service') { return 'services' }
  if ($hay -match 'course') { return 'courses' }
  if ($hay -match 'taxi|transport') { return 'transport' }
  if ($hay -match 'film|kino|music|video') { return 'media' }
  if ($hay -match 'dating|anketa|community|users') { return 'community' }
  if ($hay -match 'promo|sale') { return 'promo' }
  return 'platform'
}

function Read-TitleAndDescription([string]$filePath) {
  $content = Get-Content -LiteralPath $filePath -Raw -Encoding UTF8
  $titleMatch = [regex]::Match($content, '<title>(.*?)</title>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Singleline)
  $descMatch = [regex]::Match($content, '<meta\s+name=["'']description["'']\s+content=["''](.*?)["'']', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

  $title = if ($titleMatch.Success) { ($titleMatch.Groups[1].Value -replace '\s+', ' ').Trim() } else { '' }
  $desc = if ($descMatch.Success) { ($descMatch.Groups[1].Value -replace '\s+', ' ').Trim() } else { '' }
  return @{ title = $title; description = $desc }
}

$allHtml = Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.html' |
  Where-Object {
    $full = $_.FullName
    $name = $_.Name.ToLower()
    if ($excludeFiles -contains $name) { return $false }

    foreach ($dir in $excludeDirs) {
      if ($full -like ('*' + $dir + '*')) { return $false }
    }
    return $true
  }

$items = @()

foreach ($f in $allHtml) {
  $rel = $f.FullName.Substring($root.Length).TrimStart('\\')
  $url = '/' + ($rel -replace '\\', '/')
  $meta = Read-TitleAndDescription $f.FullName

  $title = $meta.title
  if (-not $title) {
    $title = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
  }

  $desc = $meta.description
  if (-not $desc) {
    $desc = 'Page updated: ' + $title
  }

  $items += [pscustomobject][ordered]@{
    file = $f.Name
    slug = ConvertTo-Slug([System.IO.Path]::GetFileNameWithoutExtension($f.Name))
    title = $title
    description = $desc
    category = Get-Category $rel $title $f.Name
    url = $url
    createdAt = $f.CreationTime.ToString('s')
    updatedAt = $f.LastWriteTime.ToString('s')
  }
}

$items = $items | Sort-Object -Property @{ Expression = { [datetime]$_.updatedAt }; Descending = $true }

$payload = [ordered]@{
  generatedAt = (Get-Date).ToString('s')
  count = $items.Count
  items = $items
}

$payload | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $outFile -Encoding UTF8
Write-Host "Generated: $outFile ($($items.Count) items)"
