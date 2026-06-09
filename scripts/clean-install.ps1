# Чистая переустановка зависимостей (Windows)
# Запуск: powershell -ExecutionPolicy Bypass -File scripts\clean-install.ps1
# Закройте Cursor/терминалы с npm run dev перед запуском!

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "Stopping node processes (if any)..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Removing node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\api\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\web\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "npm cache verify..." -ForegroundColor Yellow
npm cache verify

Write-Host "Installing API (без Vite/esbuild)..." -ForegroundColor Cyan
Push-Location apps\api
npm install --no-audit --no-fund
Pop-Location

Write-Host "Installing WEB..." -ForegroundColor Cyan
Push-Location apps\web
npm install --no-audit --no-fund
Pop-Location

Write-Host "Linking workspaces at root..." -ForegroundColor Cyan
npm install --no-audit --no-fund

Write-Host "Done. Run: npm run db:migrate" -ForegroundColor Green
