@echo off
echo ==========================================
echo   SISTEMA DE ESTAGIARIOS - STARTUP
echo ==========================================
echo.

echo [1/4] Verificando dependencias do backend...
cd /d "%~dp0api"
if not exist "venv" (
    echo Criando ambiente virtual Python...
    python -m venv venv
)

echo.
echo [2/4] Ativando ambiente virtual e instalando dependencias...
call venv\Scripts\activate.bat
pip install --quiet fastapi uvicorn sqlalchemy python-jose[cryptography] passlib[bcrypt] python-multipart jinja2

echo.
echo [3/4] Aplicando migracoes do banco de dados...
python tools\apply_migration.py

echo.
echo [4/4] Iniciando servidor API...
echo Backend rodando em: http://localhost:8001
echo Documentacao da API: http://localhost:8001/docs
echo.
python -m uvicorn app.main:app --reload --port 8001