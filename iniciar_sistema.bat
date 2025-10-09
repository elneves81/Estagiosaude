@echo off
echo ==========================================
echo   SISTEMA DE ESTAGIARIOS - COMPLETO
echo ==========================================
echo.
echo Iniciando backend e frontend simultaneamente...
echo.

REM Inicia o backend em uma nova janela
start "Backend API" cmd /k "cd /d "%~dp0" && iniciar_backend.bat"

REM Aguarda um pouco para o backend inicializar
echo Aguardando backend inicializar...
timeout /t 8 /nobreak >nul

REM Inicia o frontend em uma nova janela
start "Frontend Web" cmd /k "cd /d "%~dp0" && iniciar_frontend.bat"

echo.
echo ==========================================
echo   SISTEMA INICIADO!
echo ==========================================
echo.
echo Backend: http://localhost:8001
echo API Docs: http://localhost:8001/docs
echo Frontend: http://localhost:5173
echo.
echo Credenciais de admin:
echo Email: admin@estagios.local
echo Senha: admin123
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul