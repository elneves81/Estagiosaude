@echo off
title Sistema de Estagios - Menu Principal
color 0A

:menu
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║           SISTEMA DE GESTAO DE ESTAGIOS             ║
echo  ╠══════════════════════════════════════════════════════╣
echo  ║                                                      ║
echo  ║  [1] Iniciar Sistema Completo (Backend + Frontend)  ║
echo  ║  [2] Iniciar apenas Backend (API)                   ║
echo  ║  [3] Iniciar apenas Frontend (Web)                  ║
echo  ║  [4] Abrir documentação da API                       ║
echo  ║  [5] Verificar status dos serviços                  ║
echo  ║  [6] Informações do sistema                          ║
echo  ║  [0] Sair                                            ║
echo  ║                                                      ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
set /p opcao="Digite sua opcao: "

if "%opcao%"=="1" goto sistema_completo
if "%opcao%"=="2" goto backend
if "%opcao%"=="3" goto frontend
if "%opcao%"=="4" goto docs
if "%opcao%"=="5" goto status
if "%opcao%"=="6" goto info
if "%opcao%"=="0" goto sair
goto menu

:sistema_completo
cls
echo Iniciando sistema completo...
call iniciar_sistema.bat
goto menu

:backend
cls
echo Iniciando backend...
call iniciar_backend.bat
pause
goto menu

:frontend
cls
echo Iniciando frontend...
call iniciar_frontend.bat
pause
goto menu

:docs
cls
echo Abrindo documentação da API...
start http://localhost:8001/docs
goto menu

:status
cls
echo Verificando status dos serviços...
echo.
echo Backend (porta 8001):
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8001/health' -TimeoutSec 3 -UseBasicParsing; Write-Host '✓ Backend ONLINE' -ForegroundColor Green } catch { Write-Host '✗ Backend OFFLINE' -ForegroundColor Red }"
echo.
echo Frontend (porta 5173):
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5173' -TimeoutSec 3 -UseBasicParsing; Write-Host '✓ Frontend ONLINE' -ForegroundColor Green } catch { Write-Host '✗ Frontend OFFLINE' -ForegroundColor Red }"
echo.
pause
goto menu

:info
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║                INFORMAÇÕES DO SISTEMA                ║
echo  ╠══════════════════════════════════════════════════════╣
echo  ║                                                      ║
echo  ║  Frontend: http://localhost:5173                     ║
echo  ║  Backend:  http://localhost:8001                     ║
echo  ║  API Docs: http://localhost:8001/docs                ║
echo  ║                                                      ║
echo  ║  CREDENCIAIS DE ADMIN:                               ║
echo  ║  Email: admin@estagios.local                         ║
echo  ║  Senha: admin123                                     ║
echo  ║                                                      ║
echo  ║  FUNCIONALIDADES:                                    ║
echo  ║  • Gestão de usuários (3 tipos)                     ║
echo  ║  • Cadastro de supervisores                          ║
echo  ║  • Gestão completa de estágios                       ║
echo  ║  • Catálogos (instituições, cursos, unidades)       ║
echo  ║  • Importação de planilhas                           ║
echo  ║  • Relatórios em PDF/HTML                            ║
echo  ║                                                      ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
pause
goto menu

:sair
cls
echo.
echo Encerrando...
echo Obrigado por usar o Sistema de Gestão de Estágios!
timeout /t 2 /nobreak >nul
exit