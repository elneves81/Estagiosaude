@echo off
echo ==========================================
echo   SISTEMA DE ESTAGIARIOS - FRONTEND
echo ==========================================
echo.

echo [1/3] Verificando dependencias do frontend...
cd /d "%~dp0web"

if not exist "node_modules" (
    echo Instalando dependencias npm...
    npm install
)

echo.
echo [2/3] Verificando se o backend esta rodando...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8001/health' -TimeoutSec 5 -UseBasicParsing; Write-Host 'Backend OK!' } catch { Write-Host 'AVISO: Backend nao encontrado. Inicie o backend primeiro com iniciar_backend.bat' -ForegroundColor Yellow }"

echo.
echo [3/3] Iniciando servidor de desenvolvimento...
echo Frontend rodando em: http://localhost:5173
echo.
npm run dev