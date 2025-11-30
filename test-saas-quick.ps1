# Быстрая проверка SaaS-исправлений (без build)
Write-Host "🚀 Быстрая проверка SaaS-исправлений..." -ForegroundColor Cyan
Write-Host ""

# Линтер
Write-Host "Линтер..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "✅ Линтер OK" -ForegroundColor Green
Write-Host ""

# Unit тесты
Write-Host "Unit тесты..." -ForegroundColor Yellow
npm run test:unit -- --testPathPatterns="performance-monitoring.interceptor.unit.test|redis.service.scanKeys.unit.test|role.*unit.test"
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "✅ Тесты OK" -ForegroundColor Green
Write-Host ""

Write-Host "================================" -ForegroundColor Green
Write-Host "✅ БЫСТРАЯ ПРОВЕРКА ПРОЙДЕНА" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

