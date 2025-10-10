@echo off
echo ==========================================
echo   SISTEMA DE ESTAGIARIOS - COMPLETO
echo ==========================================
echo.
echo Verificando e preparando ambiente...

REM Verifica se a pasta api existe
if not exist "%~dp0api" (
    echo ERRO: Pasta 'api' nao encontrada!
    pause
    exit /b 1
)

REM Entra na pasta api para verificar/criar ambiente
cd /d "%~dp0api"

REM Cria venv se nao existir
if not exist "venv" (
    echo Criando ambiente virtual Python...
    py -m venv venv
    if errorlevel 1 (
        echo ERRO: Falha ao criar ambiente virtual
        pause
        exit /b 1
    )
)

REM Ativa venv e instala dependencias
call venv\Scripts\activate
if not exist "venv\.deps_installed" (
    echo Instalando dependencias...
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias
        pause
        exit /b 1
    )
    echo. > venv\.deps_installed
)

REM Aplica migracao
echo Aplicando migracao do banco...
python tools\apply_migration.py
if errorlevel 1 (
    echo ERRO: Falha na migracao
    pause
    exit /b 1
)

REM Cria usuario admin
python setup_admin.py

echo.
echo Iniciando backend e frontend simultaneamente...
echo.

REM Inicia o backend em uma nova janela
set UVICORN_RELOAD_IMPLEMENTATION=stat
start "Backend API" cmd /k "cd /d "%~dp0api" && call venv\Scripts\activate && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

REM Aguarda um pouco para o backend inicializar
echo Aguardando backend inicializar...
timeout /t 10 /nobreak >nul

REM Inicia o frontend em uma nova janela (se existir)
if exist "%~dp0web" (
    start "Frontend Web" cmd /k "cd /d "%~dp0web" && npm run dev"
) else (
    echo Frontend (pasta web) nao encontrado, pulando...
)

REM Volta para a pasta raiz
cd /d "%~dp0"

echo.
echo ==========================================
echo   SISTEMA INICIADO!
echo ==========================================
echo.
echo Backend: http://localhost:8001
echo API Docs: http://localhost:8001/docs
echo Login Web: http://localhost:8001/web/login
echo Frontend: http://localhost:5173
echo.
echo Credenciais de admin:
echo Email: admin@estagios.local
echo Senha: admin123
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul