# Keep-alive loop for Estagio API
param(
    [int]$DelaySeconds = 2
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "[EstagioAPI] Keep-alive iniciado. Diretório: $scriptDir"

while ($true) {
    try {
        Write-Host "[EstagioAPI] Iniciando start_server.ps1..."
        $log = Join-Path $scriptDir 'server.log'
        # Executa o servidor no mesmo processo para herdar o ambiente; bloqueia até encerrar
        & "$scriptDir/start_server.ps1" 2>&1 | Tee-Object -FilePath $log -Append
        $exitCode = $LASTEXITCODE
        Write-Warning "[EstagioAPI] Servidor finalizado (exit $exitCode). Reiniciando em $DelaySeconds s..."
        Add-Content -Path $log -Value ("`n[Restart] {0:u} - exit {1}`n" -f (Get-Date), $exitCode)
    } catch {
        $msg = "[EstagioAPI] Erro ao iniciar: $($_.Exception.Message)"
        Write-Error $msg
        Add-Content -Path (Join-Path $scriptDir 'server.log') -Value $msg
    }
    Start-Sleep -Seconds $DelaySeconds
}
