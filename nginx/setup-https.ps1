# Run as Administrator!
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$NginxDir   = "C:\nginx"
$SslDir     = "$NginxDir\ssl"
$NginxConf  = "$NginxDir\conf\studyhub.conf"
$ServerIP   = "132.73.84.63"

Write-Host "=== StudyHub HTTPS Setup ===" -ForegroundColor Cyan

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

# 2. Create SSL directory
New-Item -ItemType Directory -Force -Path $SslDir | Out-Null

# 3. Generate self-signed certificate
Write-Host "Generating self-signed SSL certificate..."
$cert = New-SelfSignedCertificate `
    -DnsName $ServerIP `
    -CertStoreLocation "cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(2) `
    -KeyAlgorithm RSA -KeyLength 2048 `
    -KeyExportPolicy Exportable

# Export as PFX
$pfxPath = "$SslDir\studyhub.pfx"
$pfxPwd  = ConvertTo-SecureString "studyhub_ssl" -AsPlainText -Force
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pfxPwd | Out-Null

# Convert PFX -> PEM using openssl (comes with Git for Windows)
$openssl = "C:\Program Files\Git\usr\bin\openssl.exe"
if (-not (Test-Path $openssl)) {
    $openssl = (Get-Command openssl -ErrorAction SilentlyContinue)?.Source
}
if (-not $openssl) {
    Write-Host "ERROR: openssl not found. Install Git for Windows and rerun." -ForegroundColor Red
    exit 1
}

& $openssl pkcs12 -in $pfxPath -nocerts -nodes -out "$SslDir\studyhub.key" -passin pass:studyhub_ssl 2>$null
& $openssl pkcs12 -in $pfxPath -clcerts -nokeys -out "$SslDir\studyhub.crt" -passin pass:studyhub_ssl 2>$null
Remove-Item $pfxPath

Write-Host "SSL certificate generated." -ForegroundColor Green

# 4. Copy nginx config
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item "$scriptDir\studyhub.conf" "$NginxDir\conf\studyhub.conf" -Force

# Fix SSL paths in config for Windows (forward slashes)
$conf = Get-Content "$NginxDir\conf\studyhub.conf" -Raw
$conf = $conf -replace '/etc/nginx/ssl/', 'C:/nginx/ssl/'
Set-Content "$NginxDir\conf\studyhub.conf" $conf -Encoding UTF8

# Include our config from the main nginx.conf
$mainConf = Get-Content "$NginxDir\conf\nginx.conf" -Raw
if ($mainConf -notmatch 'studyhub.conf') {
    $mainConf = $mainConf -replace '(http\s*\{)', "`$1`n    include studyhub.conf;"
    Set-Content "$NginxDir\conf\nginx.conf" $mainConf -Encoding UTF8
}

# Remove default server block from nginx.conf to avoid port conflict
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
Write-Host "Site available at: https://$ServerIP" -ForegroundColor Cyan
Write-Host "Browser will warn about self-signed certificate - click 'Advanced' -> 'Proceed'."
Write-Host ""
Write-Host "To stop nginx:   taskkill /f /im nginx.exe"
Write-Host "To reload nginx: C:\nginx\nginx.exe -s reload -p C:\nginx"
