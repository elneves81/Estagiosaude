param(
  [string]$ServiceName = "estagios-backend",
  [string]$DisplayName = "Sistema de Estágios - Backend",
  [string]$Description = "FastAPI (uvicorn) do Sistema de Estágios",
  [string]$Port = "8001"
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiDir = Join-Path $root "api"
$venvPython = Join-Path $apiDir "venv/Scripts/python.exe"
$uvicorn = "$venvPython -m uvicorn app.main:app --host 127.0.0.1 --port $Port --proxy-headers"

if (-not (Test-Path $venvPython)) {
  Write-Host "[SETUP] Criando venv..."
  python -m venv (Join-Path $apiDir 'venv')
}

Write-Host "[DEP] Instalando dependências (se necessário)..."
& $venvPython -m pip install --upgrade pip | Out-Null
& $venvPython -m pip install -r (Join-Path $apiDir 'requirements.txt')

Write-Host "[DB] Aplicando migração..."
& $venvPython (Join-Path $apiDir 'tools/apply_migration.py')

Write-Host "[ADMIN] Verificando admin..."
& $venvPython (Join-Path $apiDir 'setup_admin.py')

# NSSM path detection
$nssm = (Get-Command nssm -ErrorAction SilentlyContinue)?.Source
if (-not $nssm) {
  Write-Warning "NSSM não encontrado no PATH. Baixe em https://nssm.cc/ e adicione ao PATH."
  Write-Host "Como alternativa, você pode usar o Agendador de Tarefas com o script run_backend.bat."
  exit 1
}

Write-Host "[SVC] Instalando serviço $ServiceName..."
& $nssm install $ServiceName "$venvPython" "-m" "uvicorn" "app.main:app" "--host" "127.0.0.1" "--port" "$Port" "--proxy-headers"
& $nssm set $ServiceName AppDirectory $apiDir
& $nssm set $ServiceName DisplayName $DisplayName
& $nssm set $ServiceName Description $Description
& $nssm set $ServiceName Start SERVICE_AUTO_START
& $nssm set $ServiceName AppStdout (Join-Path $root 'service\backend.out.log')
& $nssm set $ServiceName AppStderr (Join-Path $root 'service\backend.err.log')
& $nssm set $ServiceName AppStdoutCreationDisposition 2
& $nssm set $ServiceName AppStderrCreationDisposition 2

Write-Host "[SVC] Iniciando serviço..."
& $nssm start $ServiceName

Write-Host "OK! Acesse http://localhost:$Port"
