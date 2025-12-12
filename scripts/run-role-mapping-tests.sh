#!/bin/bash

# Скрипт для запуска всех Role Mapping тестов с логированием
# Этап 4: Role Mapping (8-10 часов)
#
# Использование:
#   ./scripts/run-role-mapping-tests.sh
#   ./scripts/run-role-mapping-tests.sh --verbose
#   ./scripts/run-role-mapping-tests.sh --coverage
#   ./scripts/run-role-mapping-tests.sh --watch
#   ./scripts/run-role-mapping-tests.sh --debug-sql

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================================================${NC}"
echo -e "${BLUE}Role Mapping Tests (Этап 4: Role Mapping)${NC}"
echo -e "${BLUE}================================================================================${NC}"
echo ""

# Определяем аргументы
ARGS=""

# Добавляем дополнительные опции
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose)
            ARGS="$ARGS --verbose"
            shift
            ;;
        --coverage)
            ARGS="$ARGS --coverage"
            shift
            ;;
        --watch)
            ARGS="$ARGS --watch"
            shift
            ;;
        --debug-sql)
            ARGS="$ARGS --debug-sql"
            shift
            ;;
        *)
            echo -e "${YELLOW}Неизвестный аргумент: $1${NC}"
            shift
            ;;
    esac
done

echo -e "${GREEN}🚀 Запуск Role Mapping тестов...${NC}"
echo -e "${BLUE}📝 Логи будут сохранены в: test-logs/${NC}"
echo ""

# Запускаем скрипт
node scripts/run-role-mapping-tests-with-log.mjs $ARGS

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Все Role Mapping тесты прошли успешно!${NC}"
else
    echo -e "${RED}❌ Некоторые тесты не прошли. Проверьте логи в test-logs/${NC}"
fi

exit $EXIT_CODE

