#!/bin/bash

# Скрипт для запуска SSO тестов (Stage 3: SSO Integration) с логированием
#
# Использование:
#   ./scripts/run-sso-tests.sh --unit
#   ./scripts/run-sso-tests.sh --integration
#   ./scripts/run-sso-tests.sh --unit --integration
#   ./scripts/run-sso-tests.sh --unit --verbose
#   ./scripts/run-sso-tests.sh --unit --coverage
#   ./scripts/run-sso-tests.sh --debug-sql

set -e

# Передаем все аргументы в Node.js скрипт
node scripts/run-sso-tests-with-log.mjs "$@"

