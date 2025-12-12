# Скрипт для запуска integration тестов audit endpoints (PowerShell)

Write-Host "🔍 Запуск integration тестов для Role Audit Controller..." -ForegroundColor Cyan
Write-Host ""

# Базовый запуск всех integration тестов audit
npm run test:integration -- --testPathPatterns="role-audit.controller.integration.test"

