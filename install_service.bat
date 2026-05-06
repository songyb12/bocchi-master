@echo off
:: 14_BocchiMaster - Servy service installer
:: Run as Administrator. Builds dist first, then registers Servy service
:: that runs `vite preview` on :3001 with health check enabled.
::
:: Note: if port 3001 is held by a zombie process, Servy will fail to
:: start (--strictPort). Resolve the zombie first (Task Manager / taskkill).

echo [1/3] Building dist...
cd /d "C:\Claude\14_BocchiMaster"
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo [2/3] Preparing log dir...
if not exist "C:\Claude\14_BocchiMaster\data\logs" mkdir "C:\Claude\14_BocchiMaster\data\logs"

echo [3/3] Installing Servy service...
"C:\Program Files\Servy\servy-cli.exe" install ^
  --name=BocchiMaster ^
  --displayName="14_BocchiMaster Guitar Practice Studio" ^
  --description="Guitar & Bass practice SPA (vite preview, port 3001)" ^
  --path="C:\nvm4w\nodejs\node.exe" ^
  --params="node_modules/vite/bin/vite.js preview --port 3001 --host 0.0.0.0 --strictPort" ^
  --startupDir="C:\Claude\14_BocchiMaster" ^
  --startupType=Automatic ^
  --enableHealth ^
  --healthUrl="http://localhost:3001/" ^
  --heartbeatInterval=60 ^
  --maxFailedChecks=3 ^
  --recoveryAction="RestartProcess" ^
  --maxRestartAttempts=5 ^
  --stdout="C:\Claude\14_BocchiMaster\data\logs\service_stdout.log" ^
  --stderr="C:\Claude\14_BocchiMaster\data\logs\service_stderr.log"

if %errorlevel% neq 0 (
    echo Failed to install service.
    pause
    exit /b 1
)

echo.
echo Service installed successfully.
"C:\Program Files\Servy\servy-cli.exe" start --name=BocchiMaster
echo Service started. Check http://localhost:3001/
pause
