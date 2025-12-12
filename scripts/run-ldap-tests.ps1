# Скрипт для запуска всех LDAP/AD тестов с логированием
# Этап 2: LDAP/AD интеграция (16-20 часов)
#
# Использование:
#   .\scripts\run-ldap-tests.ps1
#   .\scripts\run-ldap-tests.ps1 -Unit
#   .\scripts\run-ldap-tests.ps1 -Integration
#   .\scripts\run-ldap-tests.ps1 -Verbose
#   .\scripts\run-ldap-tests.ps1 -Coverage

param(
    [switch]$Unit,
    [switch]$Integration,
    [switch]$Verbose,
    [switch]$Coverage,
    [switch]$DebugSql
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "LDAP/AD Integration Tests (Этап 2)" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Формируем аргументы
$args = @()

if ($Unit) {
    $args += "--unit"
}

if ($Integration) {
    $args += "--integration"
}

# Если не указан тип тестов, запускаем все
if (-not $Unit -and -not $Integration) {
    $args += "--unit"
    $args += "--integration"
}

if ($Verbose) {
    $args += "--verbose"
}

if ($Coverage) {
    $args += "--coverage"
}

if ($DebugSql) {
    $args += "--debug-sql"
}

Write-Host "🚀 Запуск LDAP/AD тестов..." -ForegroundColor Green
Write-Host "📝 Логи будут сохранены в: test-logs\" -ForegroundColor Cyan
Write-Host ""

# Запускаем скрипт
$scriptPath = Join-Path $PSScriptRoot "run-ldap-tests-with-log.mjs"
$nodeArgs = @("$scriptPath") + $args

& node $nodeArgs

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ Все LDAP/AD тесты прошли успешно!" -ForegroundColor Green
} else {
    Write-Host "❌ Некоторые LDAP/AD тесты провалились (код: $exitCode)" -ForegroundColor Red
}

exit $exitCode


