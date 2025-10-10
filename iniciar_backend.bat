@echo off
setlocal ENABLEDELAYEDEXPANSION
echo ==========================================
echo   SISTEMA DE ESTAGIARIOS - BACKEND (OTIMIZADO)
echo ==========================================
echo.
echo Uso: iniciar_backend.bat [noreload|stat|reset]
echo.

REM Ir para pasta api
cd /d "%~dp0api" || (echo [ERRO] Pasta api nao encontrada & exit /b 1)

REM 1. Criar venv se nao existir
if not exist venv (
    echo [SETUP] Criando ambiente virtual Python...
    py -m venv venv || python -m venv venv || (echo [ERRO] Falha ao criar venv & exit /b 1)
)

REM 2. Ativar venv
call "venv\Scripts\activate.bat" || (echo [ERRO] Nao foi possivel ativar venv & exit /b 1)

REM 3. Instalar dependencias se marker nao existir
if not exist requirements.txt (
    echo [ERRO] Arquivo requirements.txt nao encontrado.
    exit /b 1
)
if not exist venv\.deps_marker (
    echo [DEP] Instalando dependencias a partir de requirements.txt ...
        python -m pip install --upgrade pip >nul 2>&1
        python -m pip install -r requirements.txt || (echo [ERRO] Falha ao instalar dependencias & exit /b 1)
    echo ok> venv\.deps_marker
) else (
    echo [DEP] Dependencias ja instaladas. (remova venv\.deps_marker para forcar)
)

REM 4. Reset opcional do banco
for %%A in (%*) do (
    if /I "%%A"=="reset" (
        echo [DB] Reset solicitado. Removendo estagios.db...
        if exist estagios.db del /q estagios.db
    )
)

REM 5. Aplicar migracao
echo [DB] Aplicando migracao...
python tools\apply_migration.py || (echo [ERRO] Migracao falhou & exit /b 1)

REM 6. Criar admin se necessario
echo [ADMIN] Verificando usuario admin...
python setup_admin.py >nul 2>&1

REM 7. Determinar modo de reload
set MODE=reload
for %%A in (%*) do (
    if /I "%%A"=="noreload" set MODE=noreload
    if /I "%%A"=="stat" set MODE=stat
)

echo.
echo [RUN] Iniciando backend (modo: %MODE%)
set CMD=python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
if /I "%MODE%"=="reload" set CMD=%CMD% --reload
if /I "%MODE%"=="stat" (
    set UVICORN_RELOAD_IMPLEMENTATION=stat
    set CMD=%CMD% --reload
)

echo Backend:             http://localhost:8001
echo Documentacao (OpenAPI): http://localhost:8001/docs
echo Admin (web):         http://localhost:8001/web/login
echo.
%CMD%

endlocal