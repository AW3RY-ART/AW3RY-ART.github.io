@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>&1
if errorlevel 1 (
  echo Python launcher "py" was not found. Install Python to run the local preview.
  pause
  exit /b 1
)

start "AW3RY Local Preview" /D "%~dp0" py -m http.server 8000 --bind 127.0.0.1
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000/"

echo The preview server is running in its own window.
echo Close the "AW3RY Local Preview" window to stop it.
