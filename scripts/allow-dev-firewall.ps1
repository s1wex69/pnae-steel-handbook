# Run as Administrator: right-click PowerShell -> Run as administrator
#   cd C:\Users\user\Desktop\stresscalc
#   .\scripts\allow-dev-firewall.ps1

$ruleName = "Vite Dev Server 5173"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Rule already exists: $ruleName"
} else {
  New-NetFirewallRule -DisplayName $ruleName `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 5173 `
    -Profile Private, Public | Out-Null
  Write-Host "Allowed inbound TCP port 5173"
}

$ruleApi = "Intech Atom API 3001"
if (-not (Get-NetFirewallRule -DisplayName $ruleApi -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName $ruleApi `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 3001 `
    -Profile Private, Public | Out-Null
  Write-Host "Allowed inbound TCP port 3001"
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -like "192.168.*" -and $_.PrefixOrigin -eq "Dhcp" } |
  Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $ip) {
  $ip = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -like "192.168.*" } |
    Select-Object -First 1 -ExpandProperty IPAddress)
}

Write-Host ""
Write-Host "Open from phone or another PC on the same Wi-Fi:"
if ($ip) {
  Write-Host "  http://${ip}:5173/"
} else {
  Write-Host "  http://<your-ip>:5173/"
  Write-Host "  Find IP: ipconfig (look for 192.168.x.x)"
}
