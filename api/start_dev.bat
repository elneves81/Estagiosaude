@echo off
setlocal

REM Wrapper para iniciar dev estável no Windows (PowerShell)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_dev.ps1"

endlocal
