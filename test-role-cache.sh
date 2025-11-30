#!/bin/bash

# Скрипт для проверки RoleCacheService
timestamp=$(date +"%Y%m%d_%H%M%S")
logFile="test-role-cache-$timestamp.log"

echo "🧪 Проверка RoleCacheService..."
echo "📝 Логи: $logFile"
echo ""

# 1. Проверка компиляции
echo "1️⃣ Проверка TypeScript компиляции..."
npm run build 2>&1 | tee -a "$logFile"
if [ $? -ne 0 ]; then
    echo "❌ Ошибка компиляции!"
    exit 1
fi
echo "✅ Компиляция успешна"
echo ""

# 2. Проверка линтера
echo "2️⃣ Проверка ESLint..."
npm run lint 2>&1 | tee -a "$logFile"
echo ""

# 3. Запуск unit тестов для RoleCacheService
echo "3️⃣ Запуск unit тестов RoleCacheService..."
npm run test:unit -- \
    --testPathPatterns="role-cache.service.unit.test.ts" \
    --verbose \
    --coverage \
    2>&1 | tee -a "$logFile"

testExitCode=$?

echo ""
echo "================================="
echo "📊 Результаты проверки:"
echo "📝 Логи: $logFile"

if [ $testExitCode -eq 0 ]; then
    echo "✅ Все тесты пройдены!"
else
    echo "❌ Некоторые тесты провалены"
fi

echo "================================="
echo ""

# Показать coverage
echo "📈 Покрытие кода:"
grep -A 2 "role-cache.service.ts" "$logFile" || echo "Coverage данные не найдены"

exit $testExitCode


