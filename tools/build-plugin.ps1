$ErrorActionPreference = "Stop"
$root   = Split-Path -Parent $PSScriptRoot
$site   = Join-Path $root "wordpress-plugin\davronmarket-site\site"
$plugin = Join-Path $root "wordpress-plugin\davronmarket-site"
$zipOut = Join-Path $root "wordpress-plugin\davronmarket-site.zip"

Write-Host ""
Write-Host "================================="
Write-Host "  DavronMarket  Build WP Plugin  "
Write-Host "================================="

# ---------- [1/6] Root HTML pages ----------
Write-Host "[1/6] HTML pages..."
$pages = @(
    "index.html","Course.html","dating.html","Films.html","games-online.html",
    "news.html","productions.html","profile.html","servises.html","shop.html",
    "sport.html","taxi.html","avia.html","music.html"
)
foreach ($p in $pages) {
    $s = Join-Path $root $p
    if (Test-Path $s) { Copy-Item $s (Join-Path $site $p) -Force; Write-Host "  -> $p" }
    else { Write-Host "  (missing) $p" }
}

# Root data / PHP files
foreach ($fn in @("music-data.json","save_resume.php")) {
    $s = Join-Path $root $fn
    if (Test-Path $s) { Copy-Item $s (Join-Path $site $fn) -Force; Write-Host "  -> $fn" }
}

# ---------- [2/6] CSS ----------
Write-Host "[2/6] CSS..."
$cssD = Join-Path $site "assets\css"
New-Item -ItemType Directory -Path $cssD -Force | Out-Null
foreach ($f in Get-ChildItem (Join-Path $root "assets\css") -Filter "*.css") {
    Copy-Item $f.FullName (Join-Path $cssD $f.Name) -Force
    Write-Host "  -> $($f.Name)"
}

# ---------- [3/6] JS ----------
Write-Host "[3/6] JS..."
$jsD = Join-Path $site "assets\js"
New-Item -ItemType Directory -Path $jsD -Force | Out-Null
foreach ($fn in @("app.js","email-auto.js")) {
    $s = Join-Path $root "assets\js\$fn"
    if (Test-Path $s) { Copy-Item $s (Join-Path $jsD $fn) -Force; Write-Host "  -> $fn" }
}
Write-Host "  (skip) engine.js - WP version preserved"
Write-Host "  (skip) news-auto.js - WP version preserved"
Write-Host "  (skip) services-auto.js - WP version preserved"

# ---------- [4/6] Sub-folders ----------
Write-Host "[4/6] Sub-folders..."

$dirs = @(
    @{ src = "Services";          dst = "Services";          filter = "*.html" },
    @{ src = "Course";            dst = "Course";            filter = "*.html" },
    @{ src = "assets\Registered"; dst = "assets\Registered"; filter = "*.html" },
    @{ src = "My-account";        dst = "My-account";        filter = "*.html" },
    @{ src = "My-account";        dst = "Пользователи";      filter = "*.html" },
    @{ src = "music";             dst = "music";             filter = "*.html" },
    @{ src = "File\Programms";    dst = "File\Programms";    filter = "*.html" },
    @{ src = "File\Games";        dst = "File\Games";        filter = "*.html" },
    @{ src = "File\Video";        dst = "File\Video";        filter = "*.html" }
)

foreach ($d in $dirs) {
    $s = Join-Path $root $d.src
    $t = Join-Path $site $d.dst
    New-Item -ItemType Directory -Path $t -Force | Out-Null
    if (Test-Path $s) {
        foreach ($f in Get-ChildItem $s -Filter $d.filter) {
            Copy-Item $f.FullName (Join-Path $t $f.Name) -Force
            Write-Host "  -> $($d.dst)\$($f.Name)"
        }
    }
}

# File/index.html (root of File section)
$fIdx = Join-Path $root "File\index.html"
if (Test-Path $fIdx) {
    $fIdxDst = Join-Path $site "File"
    New-Item -ItemType Directory -Path $fIdxDst -Force | Out-Null
    Copy-Item $fIdx (Join-Path $fIdxDst "index.html") -Force
    Write-Host "  -> File\index.html"
}

# ---------- [5/6] Indexes & data ----------
Write-Host "[5/6] Indexes..."
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "generate-news-index.ps1") | Out-Host
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "generate-services-index.ps1") | Out-Host

$nSrc = Join-Path $root "assets\data\news.index.json"
$nDst = Join-Path $site "assets\data\news.index.json"
New-Item -ItemType Directory -Path (Split-Path $nDst) -Force | Out-Null
if (Test-Path $nSrc) { Copy-Item $nSrc $nDst -Force; Write-Host "  -> assets\data\news.index.json" }

$srvIdx = Join-Path $root "Services\services.index.json"
if (Test-Path $srvIdx) {
    Copy-Item $srvIdx (Join-Path $site "Services\services.index.json") -Force
    Write-Host "  -> Services\services.index.json"
}

# ---------- [6/6] ZIP ----------
Write-Host ""
Write-Host "[6/6] Building ZIP..."
if (Test-Path $zipOut) { Remove-Item $zipOut -Force }
Compress-Archive -Path "$plugin\*" -DestinationPath $zipOut -Force
$z = Get-Item $zipOut
Write-Host ""
Write-Host "================================="
Write-Host "  DONE: $($z.FullName)"
Write-Host "  SIZE: $([math]::Round($z.Length/1KB)) KB"
Write-Host "  DATE: $($z.LastWriteTime)"
Write-Host "================================="