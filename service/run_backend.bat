@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Executa o backend diretamente (alternativa ao serviço)
cd /d "%~dp0..\api" || (echo [ERRO] Pasta api nao encontrada & exit /b 1)

if not exist venv (
  echo [SETUP] Criando venv...
  py -m venv venv || python -m venv venv || (echo [ERRO] Falha ao criar venv & exit /b 1)
)
call venv\Scripts\activate.bat || (echo [ERRO] Nao foi possivel ativar venv & exit /b 1)

if not exist requirements.txt (
  echo [ERRO] requirements.txt nao encontrado & exit /b 1
)
python -m pip install --upgrade pip >nul 2>&1
python -m pip install -r requirements.txt

python tools\apply_migration.py || (echo [ERRO] Migracao falhou & exit /b 1)
python setup_admin.py >nul 2>&1

set UVICORN_RELOAD_IMPLEMENTATION=stat
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload

endlocal
