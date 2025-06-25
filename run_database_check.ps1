# PowerShell скрипт для проверки базы данных
# Автоматическое подключение к PostgreSQL и выполнение проверки

param(
    [string]$ConnectionString = "postgresql://postgres:Astahov123!@db.vrxtrkabuasyfosmvgzp.supabase.co:5432/postgres"
)

Write-Host "=== Запуск проверки базы данных ===" -ForegroundColor Green
Write-Host "Подключение к: $ConnectionString" -ForegroundColor Yellow

# Проверяем наличие psql
try {
    $psqlVersion = psql --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ psql не найден. Установите PostgreSQL client." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ psql найден: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ psql не найден. Установите PostgreSQL client." -ForegroundColor Red
    exit 1
}

# Выполняем проверку базы данных
Write-Host "`n=== Выполнение проверки базы данных ===" -ForegroundColor Cyan

try {
    # Выполняем SQL скрипт проверки
    $result = psql $ConnectionString -f database_health_check.sql 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Проверка базы данных завершена успешно!" -ForegroundColor Green
        Write-Host "Результаты:" -ForegroundColor Yellow
        Write-Host $result
    } else {
        Write-Host "`n❌ Ошибка при выполнении проверки:" -ForegroundColor Red
        Write-Host $result
    }
} catch {
    Write-Host "`n❌ Ошибка подключения к базе данных:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n=== Проверка завершена ===" -ForegroundColor Green 