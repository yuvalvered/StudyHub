# Run as Administrator!
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$NginxDir  = "C:\nginx"
$ServerIP  = "132.73.84.63"

Write-Host "=== StudyHub HTTP Setup (port 80) ===" -ForegroundColor Cyan

# 1. Download nginx for Windows
if (-not (Test-Path "$NginxDir\nginx.exe")) {
    Write-Host "Downloading nginx for Windows..."
    $zipUrl  = "https://nginx.org/download/nginx-1.26.2.zip"
    $zipPath = "$env:TEMP\nginx.zip"
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath "C:\" -Force
    Rename-Item "C:\nginx-1.26.2" $NginxDir -ErrorAction SilentlyContinue
    Write-Host "nginx downloaded." -ForegroundColor Green
} else {
    Write-Host "nginx already exists at $NginxDir"
}

# 2. Copy nginx config
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item "$scriptDir\studyhub.conf" "$NginxDir\conf\studyhub.conf" -Force
Write-Host "nginx config copied." -ForegroundColor Green

# 3. Include our config from the main nginx.conf
$mainConf = Get-Content "$NginxDir\conf\nginx.conf" -Raw
if ($mainConf -notmatch 'studyhub.conf') {
    $mainConf = $mainConf -replace '(http\s*\{)', "`$1`n    include studyhub.conf;"
    Set-Content "$NginxDir\conf\nginx.conf" $mainConf -Encoding UTF8
}

# 4. Remove default server block from nginx.conf to avoid port conflict on 80
$mainConf = Get-Content "$NginxDir\conf\nginx.conf" -Raw
$mainConf = $mainConf -replace '(?s)server\s*\{[^}]*listen\s+80[^}]*\}', ''
Set-Content "$NginxDir\conf\nginx.conf" $mainConf -Encoding UTF8

# 5. Test config and start nginx
Write-Host "Testing nginx config..."
& "$NginxDir\nginx.exe" -t -p $NginxDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "nginx config test FAILED." -ForegroundColor Red
    exit 1
}

# Stop existing nginx if running
Get-Process nginx -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Starting nginx..."
Start-Process -FilePath "$NginxDir\nginx.exe" -WorkingDirectory $NginxDir -WindowStyle Hidden

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host "Site available at: http://$ServerIP" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop nginx:   taskkill /f /im nginx.exe"
Write-Host "To reload nginx: C:\nginx\nginx.exe -s reload -p C:\nginx"
