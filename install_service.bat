@echo off
echo Installing BocchiMaster service...
echo NOTE: Run this as Administrator

"C:\Program Files\Servy\servy-cli.exe" install ^
  --name=BocchiMaster ^
  --displayName="14_BocchiMaster Guitar Practice Studio" ^
  --description="Guitar & Bass practice web app (React SPA)" ^
  --path="C:\nvm4w\nodejs\node.exe" ^
  --params="node_modules/vite/bin/vite.js preview --port 3001 --host 0.0.0.0" ^
  --startupDir="C:\Claude\14_BocchiMaster" ^
  --startupType=Automatic ^
  --stdout="C:\Claude\14_BocchiMaster\data\logs\service_stdout.log" ^
  --stderr="C:\Claude\14_BocchiMaster\data\logs\service_stderr.log"

if %errorlevel% neq 0 (
    echo Failed to install service.
    pause
    exit /b 1
)

echo.
echo Service installed successfully.
echo Use "servy-cli start -n BocchiMaster" to start the service.
pause
