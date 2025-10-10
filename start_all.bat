@echo off
setlocal
echo ==========================================
echo   SISTEMA DE ESTAGIARIOS - BACK + FRONT
echo ==========================================
echo Uso: start_all.bat [noreload^|stat^|reset]
echo   noreload -> backend sem reload
echo   stat     -> backend com reload (stat)
echo   reset    -> recria banco antes de iniciar
echo   (Pode combinar: start_all.bat reset stat)
echo.

REM Iniciar backend em janela separada (passando argumentos originais %*)
start "Backend" cmd /k "cd /d ""%~dp0"" & iniciar_backend.bat %*"

echo [WAIT] Aguardando backend (8s)...
timeout /t 8 /nobreak >nul

REM Iniciar frontend em janela separada
start "Frontend" cmd /k "cd /d ""%~dp0"" & iniciar_frontend.bat"

echo.
echo ==========================================
echo   URLs
echo   Backend:  http://localhost:8001
echo   Docs:     http://localhost:8001/docs
echo   Frontend: http://localhost:5173
echo ==========================================
echo.
echo Pressione qualquer tecla para sair desta janela (as outras continuam)...
pause >nul
endlocal
