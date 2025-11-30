# Скрипт для проверки SaaS-исправлений
Write-Host "================================" -ForegroundColor Cyan
Write-Host "ПРОВЕРКА SAAS-ИСПРАВЛЕНИЙ" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Линтер
Write-Host "1. Запуск линтера..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Линтер обнаружил ошибки!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Линтер: пройден" -ForegroundColor Green
Write-Host ""

# 2. Build
Write-Host "2. Сборка проекта..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Сборка провалена!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Сборка: успешна" -ForegroundColor Green
Write-Host ""

# 3. Unit тесты для новых SaaS компонентов
Write-Host "3. Unit тесты (новые SaaS компоненты)..." -ForegroundColor Yellow
npm run test:unit -- --testPathPatterns="performance-monitoring.interceptor.unit.test|redis.service.scanKeys.unit.test"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Unit тесты для SaaS компонентов провалены!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Unit тесты (SaaS): пройдены" -ForegroundColor Green
Write-Host ""

# 4. Unit тесты для Role модуля
Write-Host "4. Unit тесты (Role module)..." -ForegroundColor Yellow
npm run test:unit -- --testPathPatterns="role.*unit.test"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Unit тесты для Role модуля провалены!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Unit тесты (Role): пройдены" -ForegroundColor Green
Write-Host ""

# Итог
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ГОТОВО К КОММИТУ!" -ForegroundColor Green
Write-Host ""
Write-Host "Следующий шаг:" -ForegroundColor Yellow
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'feat(saas): add multi-tenant monitoring and non-blocking Redis operations'" -ForegroundColor White

