# Запустите от имени администратора: ПКМ → «Запуск от имени администратора»
$ruleName = "Vite Dev Server 5173"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Правило уже есть: $ruleName"
} else {
  New-NetFirewallRule -DisplayName $ruleName `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 5173 `
    -Profile Private, Public | Out-Null
  Write-Host "Разрешён входящий TCP порт 5173"
}

$ruleApi = "Intech Atom API 3001"
if (-not (Get-NetFirewallRule -DisplayName $ruleApi -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName $ruleApi `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 3001 `
    -Profile Private, Public | Out-Null
  Write-Host "Разрешён входящий TCP порт 3001"
}

Write-Host ""
Write-Host "С другого устройства откройте:"
Write-Host "  http://192.168.1.117:5173/"
Write-Host "(если IP изменился — смотрите ipconfig, адаптер с 192.168.1.x)"
