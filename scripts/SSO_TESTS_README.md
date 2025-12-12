# SSO Tests Scripts

Скрипты для запуска тестов SSO интеграции (Этап 3: SAAS-017-19) с подробным логированием.

## Обзор

Эти скрипты запускают unit и integration тесты для SSO функциональности:
- **Unit тесты**: SSOStateService, SSOUserProfileMapper, SSORoleSyncService
- **Integration тесты**: OAuth2, SAML, OIDC flows, E2E flow, error handling

## Доступные скрипты

### 1. Node.js скрипт (кроссплатформенный)

**Файл:** `scripts/run-sso-tests-with-log.mjs`

```bash
# Запустить все тесты (unit + integration)
node scripts/run-sso-tests-with-log.mjs

# Запустить только unit тесты
node scripts/run-sso-tests-with-log.mjs --unit

# Запустить только integration тесты
node scripts/run-sso-tests-with-log.mjs --integration

# Запустить unit и integration тесты
node scripts/run-sso-tests-with-log.mjs --unit --integration

# С подробным выводом
node scripts/run-sso-tests-with-log.mjs --verbose

# С покрытием кода
node scripts/run-sso-tests-with-log.mjs --coverage

# С SQL логами
node scripts/run-sso-tests-with-log.mjs --debug-sql

# В режиме watch
node scripts/run-sso-tests-with-log.mjs --watch
```

### 2. Bash скрипт (Linux/macOS)

**Файл:** `scripts/run-sso-tests.sh`

```bash
# Запустить все тесты
./scripts/run-sso-tests.sh

# Запустить только unit тесты
./scripts/run-sso-tests.sh --unit

# Запустить только integration тесты
./scripts/run-sso-tests.sh --integration

# С дополнительными опциями
./scripts/run-sso-tests.sh --unit --verbose --coverage
```

### 3. PowerShell скрипт (Windows)

**Файл:** `scripts/run-sso-tests.ps1`

```powershell
# Запустить все тесты
.\scripts\run-sso-tests.ps1

# Запустить только unit тесты
.\scripts\run-sso-tests.ps1 -Unit

# Запустить только integration тесты
.\scripts\run-sso-tests.ps1 -Integration

# С дополнительными опциями
.\scripts\run-sso-tests.ps1 -Unit -Verbose -Coverage
```

## NPM скрипты

Для удобства добавлены npm скрипты в `package.json`:

```bash
# Базовые команды (без логов)
npm run test:unit:sso              # Unit тесты SSO
npm run test:integration:sso        # Integration тесты SSO
npm run test:sso                    # Все SSO тесты

# С подробными логами
npm run test:sso:log                # Все тесты с логами
npm run test:sso:log:unit          # Unit тесты с логами
npm run test:sso:log:integration   # Integration тесты с логами
npm run test:sso:log:verbose        # С подробным выводом
npm run test:sso:log:coverage       # С покрытием кода
npm run test:sso:log:debug-sql      # С SQL логами
```

## Логи

Все логи сохраняются в директорию `test-logs/` с именами файлов:
- `sso-unit-tests-YYYY-MM-DDTHH-MM-SS.log`
- `sso-integration-tests-YYYY-MM-DDTHH-MM-SS.log`

### Формат лога

Каждый лог содержит:
- Заголовок с информацией о запуске
- Статистику тестов (пройдено/провалено/всего)
- Полный вывод STDOUT
- Полный вывод STDERR
- Время выполнения

## Покрываемые тесты

### Unit тесты

1. **SSOStateService** (`sso-state.service.unit.test.ts`)
   - Генерация и валидация state parameter
   - Истечение и очистка state
   - Подсчет активных state

2. **SSOUserProfileMapper** (`sso-user-profile.mapper.unit.test.ts`)
   - Маппинг OAuth 2.0 профилей
   - Маппинг SAML профилей
   - Маппинг OIDC профилей
   - Обработка отсутствующих полей

3. **SSORoleSyncService** (`sso-role-sync.service.unit.test.ts`)
   - Just-in-time provisioning
   - Синхронизация ролей
   - Приоритет маппингов ролей

### Integration тесты

1. **OAuth2 Flow** (`oauth2.integration.test.ts`)
   - Инициирование SSO
   - Обработка callback
   - Обработка ошибок

2. **SAML Flow** (`saml.integration.test.ts`)
   - Инициирование SSO
   - Обработка callback
   - Обработка ошибок

3. **OIDC Flow** (`oidc.integration.test.ts`)
   - Инициирование SSO
   - Обработка callback
   - Обработка ошибок

4. **E2E Flow** (`sso-e2e-flow.integration.test.ts`)
   - Полный цикл SSO аутентификации
   - Error handling scenarios
   - Logout scenarios

5. **Error Handling** (`sso-error-handling.integration.test.ts`)
   - Валидация state parameter
   - Ошибки конфигурации провайдера
   - Ошибки обработки callback

## Примеры использования

### Пример 1: Быстрая проверка unit тестов

```bash
npm run test:sso:log:unit
```

### Пример 2: Полный запуск с покрытием

```bash
npm run test:sso:log:coverage
```

### Пример 3: Отладка с SQL логами

```bash
npm run test:sso:log:debug-sql
```

### Пример 4: Только integration тесты с подробным выводом

```bash
npm run test:sso:log:integration -- --verbose
```

## Troubleshooting

### Проблема: Тесты падают с ошибкой подключения к БД

**Решение:** Убедитесь, что тестовая БД настроена и миграции применены:
```bash
npx sequelize-cli db:migrate --env test
```

### Проблема: Mock серверы не запускаются

**Решение:** Проверьте, что порты не заняты другими процессами:
```bash
npm run cleanup:ports
```

### Проблема: Логи не создаются

**Решение:** Проверьте права доступа к директории `test-logs/`:
```bash
mkdir -p test-logs
chmod 755 test-logs
```

## Связанные документы

- [LDAP Tests README](./LDAP_TESTS_README.md) - аналогичные скрипты для LDAP тестов
- [Role Plan](../../.cursor/rules/SaaS/models/role.plan.mdc) - план реализации SSO интеграции

