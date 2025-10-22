@echo off
echo ==========================================
echo   TESTE DO SISTEMA - VERSAO SIMPLES
echo ==========================================
echo.

echo [1/3] Testando backend...
cd /d "%~dp0api"

REM Ativar ambiente virtual
call venv\Scripts\activate.bat

REM Aplicar migração
echo Aplicando migração...
python tools\apply_migration.py

echo.
echo [2/3] Iniciando backend na porta 8001...
start "Backend" cmd /c "python -m uvicorn app.main:app --reload --port 8001 & pause"

echo.
echo [3/3] Aguardando 5 segundos e testando conexão...
timeout /t 5 /nobreak >nul

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8001/health' -TimeoutSec 10 -UseBasicParsing; Write-Host '✅ Backend funcionando!' -ForegroundColor Green; Write-Host 'URL: http://localhost:8001' } catch { Write-Host '❌ Backend não respondeu' -ForegroundColor Red }"

echo.
echo ==========================================
echo   TESTE CONCLUIDO
echo ==========================================
echo.
echo URLs importantes:
echo • Backend: http://localhost:8001
echo • API Docs: http://localhost:8001/docs
echo.
echo Credenciais de admin:
echo • Email: admin@estagios.local
echo • Senha: admin123
echo.
pause