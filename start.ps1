<#
 Script: start.ps1
 Objetivo: Inicialização simplificada do backend (e opcional frontend) do Sistema de Estágios
 Uso:
   1. Clique com botão direito > Run with PowerShell (Executar com PowerShell)
   2. Ou no terminal:  powershell -ExecutionPolicy Bypass -File .\start.ps1
#>

param(
    [switch]$Frontend,
    [switch]$ResetDb,
    [switch]$NoReload,
    [switch]$StatReload,
    [string]$Host = '127.0.0.1',
    [int]$Port = 8001
)

Write-Host '==========================================' -ForegroundColor Cyan
Write-Host '   SISTEMA DE ESTÁGIOS - START (PowerShell)' -ForegroundColor Cyan
Write-Host '==========================================' -ForegroundColor Cyan

$ErrorActionPreference = 'Stop'

# 1. Determinar paths
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ApiDir  = Join-Path $RootDir 'api'
$WebDir  = Join-Path $RootDir 'web'
$VenvDir = Join-Path $ApiDir 'venv'
$ReqFile = Join-Path $ApiDir 'requirements.txt'
$DbFile  = Join-Path $ApiDir 'estagios.db'

Write-Host "[INFO] Pasta raiz: $RootDir"
Set-Location $ApiDir

# 2. Criar / ativar venv
if (-not (Test-Path $VenvDir)) {
    Write-Host '[SETUP] Criando ambiente virtual...' -ForegroundColor Yellow
    python -m venv venv
}

$Activate = Join-Path $VenvDir 'Scripts/Activate.ps1'
if (-not (Test-Path $Activate)) { throw 'Não foi possível localizar o activate.ps1 do venv.' }
. $Activate

# 3. Instalar dependências se necessário
Write-Host '[DEP] Verificando dependências...' -ForegroundColor Yellow
if (-not (Test-Path $ReqFile)) { throw 'requirements.txt não encontrado.' }

# Hash simples para evitar reinstalação desnecessária (opcional)
$Marker = Join-Path $VenvDir '.deps_installed.marker'
if (-not (Test-Path $Marker)) {
    Write-Host '[DEP] Instalando requirements...' -ForegroundColor Yellow
    python -m pip install --upgrade pip | Out-Null
    python -m pip install -r requirements.txt
    Get-Date | Out-File $Marker
} else {
    Write-Host '[DEP] Já instalado (remova venv ou o marker para forçar reinstalação).'
}

# 4. Reset DB opcional
if ($ResetDb) {
    if (Test-Path $DbFile) {
        Write-Host '[DB] Removendo banco existente (reset solicitado)...' -ForegroundColor Yellow
        Remove-Item $DbFile -Force
    }
}

# 5. Aplicar migração
Write-Host '[DB] Aplicando migração...' -ForegroundColor Yellow
python tools/apply_migration.py

# 6. Mostrar credenciais padrão se banco recém criado
if ($ResetDb -or -not (Test-Path $DbFile)) {
    Write-Host '[INFO] Banco inicial criado. Usuário padrão:' -ForegroundColor Green
    Write-Host '       Email: admin@estagios.local  Senha: admin123' -ForegroundColor Green
}

# 7. Iniciar backend
Write-Host "[RUN] Iniciando backend em http://$Host:$Port ..." -ForegroundColor Cyan
$Env:PYTHONPATH = $ApiDir
if ($NoReload) {
    Write-Host '[RUN] Modo sem reload (--reload desativado).' -ForegroundColor Yellow
    $cmd = "Set-Location '$ApiDir'; python -m uvicorn app.main:app --host $Host --port $Port"
}
else {
    if ($StatReload) {
        Write-Host '[RUN] Usando reloader stat (UVICORN_RELOAD_IMPLEMENTATION=stat).' -ForegroundColor Yellow
        $Env:UVICORN_RELOAD_IMPLEMENTATION = 'stat'
    }
    $cmd = "Set-Location '$ApiDir'; python -m uvicorn app.main:app --host $Host --port $Port --reload"
}
Start-Process powershell -ArgumentList "-NoExit -Command `"$cmd`"" -WindowStyle Normal

# 8. Iniciar frontend opcional
if ($Frontend -and (Test-Path $WebDir)) {
    Write-Host '[FRONT] Iniciando frontend (Vite)...' -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit -Command `"Set-Location '$WebDir'; if (Test-Path node_modules) { npm run dev } else { npm install; npm run dev }`" -WindowStyle Normal
}

Write-Host "[OK] Acesse: http://$Host:$Port/web/login" -ForegroundColor Green
Write-Host '[OK] Docs API: /docs' -ForegroundColor Green
Write-Host 'Opções:' -ForegroundColor DarkGray
Write-Host '  .\start.ps1 -ResetDb             # recriar banco' -ForegroundColor DarkGray
Write-Host '  .\start.ps1 -Frontend            # subir frontend também' -ForegroundColor DarkGray
Write-Host '  .\start.ps1 -NoReload            # sem auto reload (evita erros em Python 3.13)' -ForegroundColor DarkGray
Write-Host '  .\start.ps1 -StatReload          # força reloader stat (compatibilidade)' -ForegroundColor DarkGray
