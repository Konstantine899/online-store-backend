# PowerShell скрипт для запуска SSO тестов (Stage 3: SSO Integration) с логированием
#
# Использование:
#   .\scripts\run-sso-tests.ps1 -Unit
#   .\scripts\run-sso-tests.ps1 -Integration
#   .\scripts\run-sso-tests.ps1 -Unit -Integration
#   .\scripts\run-sso-tests.ps1 -Unit -Verbose
#   .\scripts\run-sso-tests.ps1 -Unit -Coverage
#   .\scripts\run-sso-tests.ps1 -DebugSql

param(
    [switch]$Unit,
    [switch]$Integration,
    [switch]$Verbose,
    [switch]$Coverage,
    [switch]$Watch,
    [switch]$DebugSql
)

# Преобразуем PowerShell параметры в аргументы для Node.js скрипта
$args = @()

if ($Unit) {
    $args += "--unit"
}

if ($Integration) {
    $args += "--integration"
}

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

# Запускаем Node.js скрипт
node scripts/run-sso-tests-with-log.mjs $args

