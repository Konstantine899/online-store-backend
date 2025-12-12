#!/bin/bash
# Скрипт для запуска integration тестов audit endpoints

echo "🔍 Запуск integration тестов для Role Audit Controller..."
echo ""

# Базовый запуск всех integration тестов audit
npm run test:integration -- --testPathPatterns="role-audit.controller.integration.test"

