#!/usr/bin/env pwsh
# Script para iniciar o sistema completo atualizado

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   SISTEMA DE ESTÁGIOS - VERSÃO COMPLETA  " -ForegroundColor Cyan  
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$apiDir = "C:\Users\Elber\Documents\GitHub\estagio\estagio\api"
$webDir = "C:\Users\Elber\Documents\GitHub\estagio\estagio\web"

Write-Host "[1/4] Verificando ambiente virtual..." -ForegroundColor Yellow
Set-Location $apiDir

if (-not (Test-Path "venv")) {
    Write-Host "Criando ambiente virtual..." -ForegroundColor Cyan
    python -m venv venv
}

Write-Host "[2/4] Instalando dependências..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

Write-Host "[3/4] Aplicando migração e configurando dados..." -ForegroundColor Yellow
$env:PYTHONPATH = $PWD
python tools\apply_migration.py
python setup_admin.py
python create_test_data.py

Write-Host "[4/4] Iniciando servidor..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Sistema iniciado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 ACESSO:" -ForegroundColor White
Write-Host "   Frontend: http://127.0.0.1:8001/app/" -ForegroundColor White
Write-Host "   API Docs: http://127.0.0.1:8001/docs" -ForegroundColor White
Write-Host ""
Write-Host "👥 USUÁRIOS DE TESTE:" -ForegroundColor White
Write-Host "   🔑 Admin: admin@estagios.local / Adm@2025!" -ForegroundColor White
Write-Host "   👩‍⚕️ Supervisor: supervisor@teste.com / supervisor123" -ForegroundColor White
Write-Host "   🏫 Escola: escola@teste.com / escola123" -ForegroundColor White
Write-Host ""
Write-Host "🎯 FUNCIONALIDADES DISPONÍVEIS:" -ForegroundColor White
Write-Host "   ✅ Gestão completa de usuários" -ForegroundColor Green
Write-Host "   ✅ Cadastro de supervisores" -ForegroundColor Green
Write-Host "   ✅ Controle de estágios" -ForegroundColor Green
Write-Host "   ✅ Catálogos (instituições, cursos, unidades)" -ForegroundColor Green
Write-Host "   ✅ Relatórios detalhados (PDF/HTML)" -ForegroundColor Green
Write-Host "   ✅ Interface responsiva com navegação lateral" -ForegroundColor Green
Write-Host ""
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload