@echo off
echo ==========================================
echo   SISTEMA DE ESTAGIOS - VERSAO COMPLETA
echo ==========================================
echo.

echo [1/4] Verificando ambiente virtual...
cd /d "%~dp0api"

if not exist "venv" (
    echo Criando ambiente virtual...
    python -m venv venv
)

echo.
echo [2/4] Instalando dependencias...
call venv\Scripts\activate.bat
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo.
echo [3/4] Aplicando migracao e configurando dados...
set PYTHONPATH=%CD%
python tools\apply_migration.py
python setup_admin.py
python create_test_data.py

echo.
echo [4/4] Iniciando servidor...
echo.
echo ==========================================
echo   SISTEMA INICIADO COM SUCESSO!
echo ==========================================
echo.
echo ACESSO:
echo   Frontend: http://127.0.0.1:8001/app/
echo   API Docs: http://127.0.0.1:8001/docs
echo.
echo USUARIOS DE TESTE:
echo   Admin: admin@estagios.local / Adm@2025!
echo   Supervisor: supervisor@teste.com / supervisor123
echo   Escola: escola@teste.com / escola123
echo.
echo FUNCIONALIDADES DISPONIVEIS:
echo   - Gestao completa de usuarios
echo   - Cadastro de supervisores
echo   - Controle de estagios
echo   - Catalogos (instituicoes, cursos, unidades)
echo   - Relatorios detalhados (PDF/HTML)
echo   - Interface responsiva com navegacao lateral
echo.
echo Pressione CTRL+C para parar o servidor
echo ==========================================
echo.

python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload