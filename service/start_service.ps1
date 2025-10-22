param(
  [string]$ServiceName = "estagios-backend"
)

$ErrorActionPreference = 'Stop'

$cmd = Get-Command nssm -ErrorAction SilentlyContinue
if (-not $cmd) { Write-Warning "NSSM não encontrado no PATH."; exit 1 }
$nssm = $cmd.Source

& $nssm start $ServiceName
