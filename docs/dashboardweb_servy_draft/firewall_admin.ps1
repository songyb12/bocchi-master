# 18_DashboardWeb - Windows Firewall inbound rules
# Run from elevated (admin) PowerShell

# Dev: vite dev server on 5180 (LAN/Tailscale only)
New-NetFirewallRule `
  -DisplayName "Claude_DashboardWeb_5180_dev" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 5180 `
  -Action Allow `
  -Profile Private,Domain

# Prod: Servy-managed vite preview on 8081
New-NetFirewallRule `
  -DisplayName "Claude_DashboardWeb_8081_prod" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 8081 `
  -Action Allow `
  -Profile Private,Domain

Get-NetFirewallRule -DisplayName "Claude_DashboardWeb_*" |
  Format-Table DisplayName, Enabled, Direction, Action -AutoSize
