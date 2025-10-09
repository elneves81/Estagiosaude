# PowerShell script para aplicar migração
param(
    [string]$DatabasePath = ".\estagios.db"
)

Write-Host "🔄 Aplicando migração para o banco de dados..." -ForegroundColor Yellow

try {
    # Ativar ambiente virtual se necessário
    $venvPath = ".\venv\Scripts\Activate.ps1"
    if (Test-Path $venvPath) {
        & $venvPath
    }
    
    # Executar script Python de migração
    $migrationScript = ".\tools\apply_migration.py"
    if (Test-Path $migrationScript) {
        python $migrationScript
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migração concluída com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro na migração!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Script de migração não encontrado: $migrationScript" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao executar migração: $_" -ForegroundColor Red
    exit 1
}