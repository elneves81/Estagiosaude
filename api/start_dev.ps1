# PowerShell start script for stable dev on Windows
# - Applies DB migration
# - Ensures admin user exists
# - Starts uvicorn on 127.0.0.1:8001 using stat reload (stable on Windows)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$apiDir = Join-Path $repoRoot 'api'
$toolsDir = Join-Path $apiDir 'tools'

Write-Host '=== Sistema de Estágios: DEV START ===' -ForegroundColor Cyan
Write-Host "API dir: $apiDir"

# Activate venv if present
$venvActivate = Join-Path $apiDir 'venv\Scripts\Activate.ps1'
if (Test-Path $venvActivate) {
  Write-Host 'Ativando venv...' -ForegroundColor DarkCyan
  . $venvActivate
}

# Ensure PYTHONPATH so `from app...` works
$env:PYTHONPATH = $apiDir

# 1) Apply migration
Write-Host '[1/3] Aplicando migração...' -ForegroundColor Yellow
python (Join-Path $toolsDir 'apply_migration.py')

# 2) Ensure admin
Write-Host '[2/3] Garantindo usuário admin...' -ForegroundColor Yellow
python (Join-Path $apiDir 'setup_admin.py')

# 3) Start uvicorn with stat reload on 0.0.0.0:8001 (acesso por IP da máquina)
Write-Host '[3/3] Iniciando API (0.0.0.0:8001) com reload=stat...' -ForegroundColor Yellow
$env:PYTHONPATH = $apiDir
python -m uvicorn app.main:app --reload --reload-dir $repoRoot --host 0.0.0.0 --port 8001
