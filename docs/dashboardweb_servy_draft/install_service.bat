@echo off
:: 18_DashboardWeb - Servy service installer
:: Run as Administrator
:: Builds dist first, then registers Servy service that runs vite preview on :8081

echo [1/3] Building dist...
cd /d "C:\Claude\18_DashboardWeb"
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed.
    exit /b 1
)

echo [2/3] Preparing log dir...
if not exist "C:\Claude\18_DashboardWeb\data\logs" mkdir "C:\Claude\18_DashboardWeb\data\logs"

echo [3/3] Installing Servy service...
"C:\Program Files\Servy\servy-cli.exe" install ^
  --name="DashboardWeb" ^
  --displayName="18_DashboardWeb (TV kiosk SPA)" ^
  --description="Static SPA serve (vite preview) for Chrome kiosk -> HDMI -> TV" ^
  --path="C:\Program Files\nodejs\node.exe" ^
  --params="node_modules\vite\bin\vite.js preview --port 8081 --host 0.0.0.0 --strictPort" ^
  --startupDir="C:\Claude\18_DashboardWeb" ^
  --startupType="Automatic" ^
  --enableHealth ^
  --healthUrl="http://localhost:8081/" ^
  --heartbeatInterval=60 ^
  --maxFailedChecks=3 ^
  --recoveryAction="RestartProcess" ^
  --maxRestartAttempts=5 ^
  --stdout="C:\Claude\18_DashboardWeb\data\logs\service_stdout.log" ^
  --stderr="C:\Claude\18_DashboardWeb\data\logs\service_stderr.log"

if %errorlevel% equ 0 (
    echo Service installed successfully.
    "C:\Program Files\Servy\servy-cli.exe" start --name="DashboardWeb"
    echo Service started. Check http://localhost:8081/
) else (
    echo Failed to install service. Make sure to run as Administrator.
    exit /b 1
)
