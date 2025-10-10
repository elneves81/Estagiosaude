@echo off
REM ======================================================
REM  SISTEMA DE ESTAGIOS - START BACKEND (Windows .BAT)
REM  Uso:
REM     start_backend.bat                 -> inicia backend com reload padrão
REM     start_backend.bat reset           -> recria banco antes
REM     start_backend.bat noreload        -> inicia sem --reload
REM     start_backend.bat stat            -> inicia com reload='stat'
REM ======================================================

SETLOCAL ENABLEDELAYEDEXPANSION

REM Ir para a pasta onde o .bat está
PUSHD %~dp0

TITLE Sistema de Estagios - Backend
ECHO ==========================================
ECHO   SISTEMA DE ESTAGIARIOS - BACKEND (.BAT)
ECHO ==========================================

REM Entrar na pasta api
IF NOT EXIST api ( 
  ECHO [ERRO] Pasta 'api' nao encontrada.
  GOTO :EOF
)
CD api

REM Criar venv se nao existir
IF NOT EXIST venv ( 
  ECHO [SETUP] Criando ambiente virtual...
  py -m venv venv
  IF ERRORLEVEL 1 (ECHO Falha ao criar venv & GOTO :EOF)
)

REM Ativar venv
CALL venv\Scripts\activate
IF ERRORLEVEL 1 (ECHO Nao foi possivel ativar venv & GOTO :EOF)

REM Verificar requirements
IF NOT EXIST requirements.txt (
  ECHO [ERRO] requirements.txt nao encontrado.
  GOTO :EOF
)

REM Instalar dependencias apenas 1a vez (usa marker)
IF NOT EXIST venv\.deps_installed.marker (
  ECHO [DEP] Instalando dependencias...
  python -m pip install --upgrade pip
  python -m pip install -r requirements.txt
  IF ERRORLEVEL 1 (ECHO Falha ao instalar dependencias & GOTO :EOF)
  ECHO ok> venv\.deps_installed.marker
) ELSE (
  ECHO [DEP] Dependencias ja instaladas. (remova venv\.deps_installed.marker para forcar)
)

REM Reset opcional do banco
IF /I "%1"=="reset" (
  ECHO [DB] Reset solicitado. Removendo estagios.db...
  IF EXIST estagios.db DEL /Q estagios.db
)

REM Aplicar migracao
ECHO [DB] Aplicando migracao...
python tools\apply_migration.py
IF ERRORLEVEL 1 (ECHO Falha ao aplicar migracao & GOTO :EOF)

REM Escolher modo
SET MODE=reload
FOR %%A IN (%*) DO (
  IF /I "%%A"=="noreload" SET MODE=noreload
  IF /I "%%A"=="stat" SET MODE=stat
)

IF /I "%MODE%"=="noreload" (
  ECHO [RUN] Iniciando SEM reload.
  SET CMD=python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
) ELSE IF /I "%MODE%"=="stat" (
  ECHO [RUN] Iniciando com UVICORN_RELOAD_IMPLEMENTATION=stat
  SET UVICORN_RELOAD_IMPLEMENTATION=stat
  SET CMD=python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
) ELSE (
  ECHO [RUN] Iniciando com reload padrão
  SET CMD=python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
)

ECHO [RUN] URL: http://127.0.0.1:8001
ECHO (Pressione CTRL+C para parar)
%CMD%

POPD
ENDLOCAL
GOTO :EOF
