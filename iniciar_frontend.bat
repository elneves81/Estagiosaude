@echo off
echo ==========================================
echo   SISTEMA DE ESTAGIARIOS - FRONTEND
echo ==========================================
echo.

echo [1/3] Verificando dependencias do frontend...
cd /d "%~dp0web" || (echo [ERRO] Pasta web nao encontrada & exit /b 1)

if not exist "node_modules" (
    echo Instalando dependencias npm...
    npm install || (echo [ERRO] Falha npm install & exit /b 1)
) else (
    rem Tenta detectar package.json alterado sem node_modules atualizados
    for %%F in (package-lock.json) do (
        if exist %%F (
            rem Se quiser forçar reintegração: npm ci (opcional)
            rem echo (Use: apagar node_modules para reinstalar limpo)
        )
    )
)

echo.
echo [2/3] Verificando se o backend esta rodando...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8001/health' -TimeoutSec 5 -UseBasicParsing; Write-Host 'Backend OK!' } catch { Write-Host 'AVISO: Backend nao encontrado. Inicie o backend primeiro com iniciar_backend.bat' -ForegroundColor Yellow }"

echo.
echo [3/3] Iniciando servidor de desenvolvimento...
echo Frontend rodando em: http://localhost:5173
echo.
npm run dev || (echo [ERRO] Falha ao iniciar Vite dev server & exit /b 1)