# PowerShell скрипт для запуска Role Mapping тестов (Этап 4: Role Mapping) с логированием
#
# Использование:
#   .\scripts\run-role-mapping-tests.ps1
#   .\scripts\run-role-mapping-tests.ps1 -Verbose
#   .\scripts\run-role-mapping-tests.ps1 -Coverage
#   .\scripts\run-role-mapping-tests.ps1 -Watch
#   .\scripts\run-role-mapping-tests.ps1 -DebugSql

param(
    [switch]$Verbose,
    [switch]$Coverage,
    [switch]$Watch,
    [switch]$DebugSql
)

# Преобразуем PowerShell параметры в аргументы для Node.js скрипта
$args = @()

if ($Verbose) {
    $args += "--verbose"
}

if ($Coverage) {
    $args += "--coverage"
}

if ($Watch) {
    $args += "--watch"
}

if ($DebugSql) {
    $args += "--debug-sql"
}

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Role Mapping Tests (Этап 4: Role Mapping)" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Запуск Role Mapping тестов..." -ForegroundColor Green
Write-Host "📝 Логи будут сохранены в: test-logs/" -ForegroundColor Blue
Write-Host ""

# Запускаем Node.js скрипт
$exitCode = 0
try {
    node scripts/run-role-mapping-tests-with-log.mjs $args
    $exitCode = $LASTEXITCODE
} catch {
    Write-Host "❌ Ошибка при запуске тестов: $_" -ForegroundColor Red
    $exitCode = 1
}

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ Все Role Mapping тесты прошли успешно!" -ForegroundColor Green
} else {
    Write-Host "❌ Некоторые тесты не прошли. Проверьте логи в test-logs/" -ForegroundColor Red
}

exit $exitCode

