# Скрипт для проверки RoleCacheService
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "test-role-cache-$timestamp.log"

Write-Host "🧪 Проверка RoleCacheService..." -ForegroundColor Cyan
Write-Host "📝 Логи: $logFile" -ForegroundColor Yellow
Write-Host ""

# 1. Проверка компиляции
Write-Host "1️⃣ Проверка TypeScript компиляции..." -ForegroundColor Green
npm run build 2>&1 | Tee-Object -FilePath $logFile -Append
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка компиляции!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Компиляция успешна" -ForegroundColor Green
Write-Host ""

# 2. Проверка линтера
Write-Host "2️⃣ Проверка ESLint..." -ForegroundColor Green
npm run lint 2>&1 | Tee-Object -FilePath $logFile -Append
Write-Host ""

# 3. Запуск unit тестов для RoleCacheService
Write-Host "3️⃣ Запуск unit тестов RoleCacheService..." -ForegroundColor Green
npm run test:unit -- `
    --testPathPatterns="role-cache.service.unit.test.ts" `
    --verbose `
    --coverage `
    2>&1 | Tee-Object -FilePath $logFile -Append

$testExitCode = $LASTEXITCODE

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "📊 Результаты проверки:" -ForegroundColor Yellow
Write-Host "📝 Логи: $logFile" -ForegroundColor Green

if ($testExitCode -eq 0) {
    Write-Host "✅ Все тесты пройдены!" -ForegroundColor Green
} else {
    Write-Host "❌ Некоторые тесты провалены" -ForegroundColor Red
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Показать coverage
Write-Host "📈 Покрытие кода:" -ForegroundColor Yellow
Select-String -Path $logFile -Pattern "role-cache.service.ts" -Context 0,2

exit $testExitCode


