param(
  [string]$ServiceName = "estagios-backend"
)

$ErrorActionPreference = 'Stop'

$cmd = Get-Command nssm -ErrorAction SilentlyContinue
if (-not $cmd) {
  Write-Warning "NSSM não encontrado no PATH."
  exit 1
}

$nssm = $cmd.Source
& $nssm stop $ServiceName | Out-Null
& $nssm remove $ServiceName confirm | Out-Null

Write-Host "Serviço $ServiceName removido."
