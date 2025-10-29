Write-Host "=== Watcher de Importação: START ==="
$ErrorActionPreference = 'Stop'
$apiDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $apiDir
$inbox = Join-Path $rootDir 'inbox'
if (!(Test-Path $inbox)) { New-Item -ItemType Directory -Path $inbox | Out-Null }

# Ativar venv do projeto raiz se existir
$venvRoot = Join-Path (Split-Path -Parent $rootDir) '.venv'
$venvScript = Join-Path $venvRoot 'Scripts' 'Activate.ps1'
if (Test-Path $venvScript) {
  Write-Host "Ativando venv: $venvScript"
  . $venvScript
}

# Instalar dependências necessárias
$req = Join-Path $apiDir 'requirements.txt'
if (Test-Path $req) {
  Write-Host "Instalando dependências necessárias..."
  pip install -r $req | Out-Null
}

$env:PYTHONPATH = $apiDir
$watcher = Join-Path $apiDir 'app' 'watch_inbox.py'
if (!(Test-Path $watcher)) {
  Write-Error "Arquivo não encontrado: $watcher"
  exit 1
}

Write-Host "Monitorando inbox em: $inbox"
python $watcher
