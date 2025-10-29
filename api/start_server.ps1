#!/usr/bin/env pwsh
# Script para iniciar o servidor FastAPI

$apiDir = "C:\Users\Elber\Documents\GitHub\estagio\estagio\api"
Set-Location $apiDir

# Ativar ambiente virtual
& .\venv\Scripts\Activate.ps1

# Configurar PYTHONPATH
$env:PYTHONPATH = $apiDir
${env:PYTHONIOENCODING} = 'utf-8'
${env:LC_ALL} = 'C.UTF-8'
${env:LANG} = 'C.UTF-8'

# Iniciar servidor
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload