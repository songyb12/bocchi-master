# 18_DashboardWeb Servy Drafts (option b)

Drafts prepared while awaiting user decision on Prod deployment path. Once **option (b) — 독립 Servy 서비스 (:8081)** is confirmed, copy these to `C:\Claude\18_DashboardWeb\` and run as admin.

## Files

| File | Target | Run as |
|------|--------|--------|
| `service.json` | `C:\Claude\18_DashboardWeb\service.json` | (declarative) |
| `install_service.bat` | `C:\Claude\18_DashboardWeb\install_service.bat` | Administrator |
| `firewall_admin.ps1` | `C:\Claude\18_DashboardWeb\scripts\firewall_admin.ps1` | Administrator PowerShell |

## Architecture (option b)

```
[Servy Service: DashboardWeb]
  command: node.exe node_modules/vite/bin/vite.js preview
  port:    8081 (LAN/Tailscale exposed via host=0.0.0.0)
  health:  http://localhost:8081/
  restart: 5 attempts, RestartProcess on health failure
       │
       ▼
[Chrome kiosk on HDMI → TV]
  launcher: launch_kiosk.bat prod
  URL:      http://localhost:8081/
  task:     Claude_Kiosk_DashboardWeb (ONLOGON, user-scoped)
```

## Deployment steps

```bat
:: 1. Copy drafts
copy C:\Claude\14_BocchiMaster\docs\dashboardweb_servy_draft\service.json         C:\Claude\18_DashboardWeb\
copy C:\Claude\14_BocchiMaster\docs\dashboardweb_servy_draft\install_service.bat  C:\Claude\18_DashboardWeb\
mkdir C:\Claude\18_DashboardWeb\scripts 2>nul
copy C:\Claude\14_BocchiMaster\docs\dashboardweb_servy_draft\firewall_admin.ps1   C:\Claude\18_DashboardWeb\scripts\

:: 2. Run as admin (CMD)
C:\Claude\18_DashboardWeb\install_service.bat

:: 3. Run as admin (PowerShell) — firewall rules for LAN/Tailscale
PowerShell -ExecutionPolicy Bypass -File C:\Claude\18_DashboardWeb\scripts\firewall_admin.ps1

:: 4. Register kiosk autostart (user, no admin needed)
C:\Claude\18_DashboardWeb\install_kiosk_task.bat

:: 5. Update launch_kiosk.bat trigger to prod mode (or pass 'prod' arg in task params)
::    Edit Claude_Kiosk_DashboardWeb in Task Scheduler:
::    Action -> arguments: prod
```

## Verify

```bat
:: Service status
sc query DashboardWeb

:: Health
curl http://localhost:8081/
curl http://100.111.55.55:8081/  :: Tailscale

:: Kiosk task
schtasks /query /tn Claude_Kiosk_DashboardWeb
```

## Notes

- `--strictPort` ensures the service fails fast if 8081 is occupied (vs silently picking another port).
- `health_check.url` uses `/` because vite preview doesn't expose `/health`. Servy interprets HTTP 200 as healthy.
- `dist/` must exist before service start. `install_service.bat` runs `npm run build` first.
- After future code changes: `cd C:\Claude\18_DashboardWeb && npm run build && servy-cli restart --name=DashboardWeb` (admin).
