#!/bin/bash

# Скрипт для запуска всех LDAP/AD тестов с логированием
# Этап 2: LDAP/AD интеграция (16-20 часов)
#
# Использование:
#   ./scripts/run-ldap-tests.sh
#   ./scripts/run-ldap-tests.sh --unit
#   ./scripts/run-ldap-tests.sh --integration
#   ./scripts/run-ldap-tests.sh --verbose
#   ./scripts/run-ldap-tests.sh --coverage

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================================================${NC}"
echo -e "${BLUE}LDAP/AD Integration Tests (Этап 2)${NC}"
echo -e "${BLUE}================================================================================${NC}"
echo ""

# Определяем аргументы
ARGS=""
if [ "$1" = "--unit" ] || [ "$1" = "--integration" ]; then
    ARGS="$1"
    shift
fi

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

# Если не указан тип тестов, запускаем все
if [ -z "$ARGS" ] || [ "$ARGS" = "--verbose" ] || [ "$ARGS" = "--coverage" ] || [ "$ARGS" = "--debug-sql" ]; then
    ARGS="--unit --integration $ARGS"
fi

echo -e "${GREEN}🚀 Запуск LDAP/AD тестов...${NC}"
echo -e "${BLUE}📝 Логи будут сохранены в: test-logs/${NC}"
echo ""

# Запускаем скрипт
node scripts/run-ldap-tests-with-log.mjs $ARGS

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Все LDAP/AD тесты прошли успешно!${NC}"
else
    echo -e "${RED}❌ Некоторые LDAP/AD тесты провалились (код: $EXIT_CODE)${NC}"
fi

exit $EXIT_CODE


