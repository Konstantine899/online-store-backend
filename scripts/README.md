# Скрипты очистки портов

Этот набор скриптов помогает решить проблему "EADDRINUSE: address already in use" при запуске приложения, автоматически очищая занятые порты от конфликтующих процессов.

## Проблема

При разработке часто возникают ситуации, когда:

- Приложение не может запуститься из-за занятого порта
- Остались "висящие" процессы Node.js после предыдущих запусков
- Необходимо быстро освободить порт для тестирования

## Решение

Скрипты автоматически находят и завершают процессы, занимающие указанный порт, или все процессы Node.js в системе.

## Доступные скрипты

### 1. PowerShell скрипт (Windows)

**Файл:** `scripts/cleanup-ports.ps1`

```powershell
# Очистить порт 5000 (по умолчанию)
.\scripts\cleanup-ports.ps1

# Очистить конкретный порт
.\scripts\cleanup-ports.ps1 -Port 3001

# Завершить все процессы Node.js
.\scripts\cleanup-ports.ps1 -AllNodeProcesses

# Завершить без подтверждения
.\scripts\cleanup-ports.ps1 -Force

# Показать справку
.\scripts\cleanup-ports.ps1 -Help
```

### 2. Bash скрипт (Linux/macOS)

**Файл:** `scripts/cleanup-ports.sh`

```bash
# Очистить порт 5000 (по умолчанию)
./scripts/cleanup-ports.sh

# Очистить конкретный порт
./scripts/cleanup-ports.sh -p 3001

# Завершить все процессы Node.js
./scripts/cleanup-ports.sh --all-node

# Завершить без подтверждения
./scripts/cleanup-ports.sh --force

# Показать справку
./scripts/cleanup-ports.sh --help
```

## NPM скрипты

Для удобства использования добавлены npm скрипты, которые автоматически выбирают подходящий скрипт для вашей ОС:

```bash
# Очистить порт 5000 (с подтверждением)
npm run cleanup:ports

# Очистить порт 5000 (без подтверждения)
npm run cleanup:ports:force

# Завершить все процессы Node.js (с подтверждением)
npm run cleanup:ports:all

# Завершить все процессы Node.js (без подтверждения)
npm run cleanup:ports:all:force

# Очистить порты и запустить приложение
npm run start:clean
```

## Параметры

### PowerShell скрипт

- `-Port <номер>` - порт для очистки (по умолчанию: 5000)
- `-AllNodeProcesses` - завершить все процессы Node.js
- `-Force` - завершить без подтверждения
- `-Help` - показать справку

### Bash скрипт

- `-p, --port <номер>` - порт для очистки (по умолчанию: 5000)
- `-a, --all-node` - завершить все процессы Node.js
- `-f, --force` - завершить без подтверждения
- `-h, --help` - показать справку

## Примеры использования

### Сценарий 1: Стандартная очистка порта

```bash
# Windows
npm run cleanup:ports

# Linux/macOS
./scripts/cleanup-ports.sh
```

### Сценарий 2: Очистка конкретного порта

```bash
# Windows
.\scripts\cleanup-ports.ps1 -Port 3001

# Linux/macOS
./scripts/cleanup-ports.sh -p 3001
```

### Сценарий 3: Массовая очистка всех Node.js процессов

```bash
# Windows
npm run cleanup:ports:all

# Linux/macOS
./scripts/cleanup-ports.sh --all-node
```

### Сценарий 4: Автоматический запуск с очисткой

```bash
# Очищает порты и сразу запускает приложение
npm run start:clean
```

## Безопасность

⚠️ **Внимание:** Скрипты завершают процессы принудительно. Убедитесь, что:

- Вы не потеряете важные данные
- Не завершаются критические процессы системы
- У вас есть права на завершение процессов

## Рекомендации

1. **Для разработки:** используйте `npm run start:clean` для автоматической очистки и запуска
2. **Для CI/CD:** используйте флаг `--force` для автоматического выполнения
3. **Для отладки:** сначала запустите без `--force` чтобы увидеть список процессов

## Устранение проблем

### Ошибка "Execution Policy" в PowerShell

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Ошибка "Permission denied" в Linux/macOS

```bash
chmod +x scripts/cleanup-ports.sh
```

### Скрипт не находит процессы

- Убедитесь, что у вас есть права администратора/root
- Проверьте, что процессы действительно запущены
- Используйте `netstat` или `lsof` для ручной проверки

## Интеграция с IDE

### Visual Studio Code

Добавьте в `tasks.json`:

```json
{
    "label": "Clean Ports",
    "type": "shell",
    "command": "npm run cleanup:ports:force",
    "group": "build"
}
```

### WebStorm/IntelliJ

Настройте External Tool:

- Name: Clean Ports
- Program: npm
- Arguments: run cleanup:ports:force

## Автоматизация

Для автоматической очистки при каждом запуске добавьте в `package.json`:

```json
{
    "scripts": {
        "prestart:dev": "npm run cleanup:ports:force"
    }
}
```

## Скрипты логирования тестов

Набор скриптов для запуска тестов с записью результатов в файлы логов для последующего анализа.

### Доступные скрипты

#### 1. Универсальный скрипт логирования

**Файл:** `scripts/run-tests-with-log.js`

Универсальный скрипт для запуска любых тестов с логированием.

```bash
# Запустить тесты по паттерну
node scripts/run-tests-with-log.js "audit.*unit.test"

# Запустить с опциями Jest
node scripts/run-tests-with-log.js --selectProjects unit audit --verbose

# Запустить с coverage
node scripts/run-tests-with-log.js "audit.service.unit.test" --coverage
```

**Параметры:**

- Первый аргумент без `--` - паттерн для `--testPathPatterns`
- `--selectProjects <project>` - выбрать проект Jest (unit/integration)
- `--testPathPatterns <pattern>` - явно указать паттерн
- `--verbose` - подробный вывод
- `--coverage` - включить покрытие
- `--watch` - режим watch
- `--runInBand` - запускать последовательно

#### 2. Unit тесты audit сервисов

**Файл:** `scripts/run-audit-unit-tests-with-log.js`

Специализированный скрипт для unit тестов audit сервисов:

- `audit.service.unit.test.ts`
- `role-audit.service.unit.test.ts`

```bash
# Стандартный запуск
node scripts/run-audit-unit-tests-with-log.js

# С подробным выводом
node scripts/run-audit-unit-tests-with-log.js --verbose

# С покрытием кода
node scripts/run-audit-unit-tests-with-log.js --coverage

# В режиме watch
node scripts/run-audit-unit-tests-with-log.js --watch
```

#### 3. Integration тесты audit endpoints

**Файл:** `scripts/run-audit-integration-tests-with-log.js`

Скрипт для integration тестов audit контроллеров.

```bash
node scripts/run-audit-integration-tests-with-log.js
```

### NPM скрипты

Для удобства использования добавлены npm скрипты:

```bash
# Unit тесты audit с логированием
npm run test:unit:audit:log

# Unit тесты audit с подробным выводом
npm run test:unit:audit:log:verbose

# Unit тесты audit с покрытием
npm run test:unit:audit:log:coverage

# Integration тесты audit с логированием
npm run test:integration:audit:log

# Универсальный скрипт (требует параметры)
npm run test:log -- "audit.*unit.test"
```

### Формат логов

Логи сохраняются в директории `test-logs/` с именами:

- `audit-unit-tests-YYYY-MM-DDTHH-mm-ss-sssZ.log`
- `audit-integration-tests-YYYY-MM-DDTHH-mm-ss-sssZ.log`
- `unit-tests-YYYY-MM-DDTHH-mm-ss-sssZ.log` (универсальный)

**Структура лога:**

```
=== Test Execution Log ===
Date: 2024-01-01T12:00:00.000Z
Command: jest --selectProjects unit --testPathPatterns audit.*unit.test
Working Directory: /path/to/project
Node Version: v20.10.0
============================================================

[вывод тестов]

============================================================
Exit Code: 0
Duration: 12.34s
Finished at: 2024-01-01T12:00:12.340Z
============================================================

Test Results:
  Total: 42
  Passed: 42
  Failed: 0
```

### Примеры использования

#### Сценарий 1: Запуск unit тестов audit с логированием

```bash
npm run test:unit:audit:log
```

#### Сценарий 2: Отладка падающих тестов с подробным выводом

```bash
npm run test:unit:audit:log:verbose
```

#### Сценарий 3: Проверка покрытия тестами

```bash
npm run test:unit:audit:log:coverage
```

#### Сценарий 4: Запуск конкретного тестового файла

```bash
node scripts/run-tests-with-log.js "audit.service.unit.test" --verbose
```

### Особенности

1. **Двойной вывод:** Логи выводятся одновременно в консоль и в файл
2. **Автоматическая статистика:** Подсчёт пройденных/упавших тестов
3. **Таймстампы:** Каждый лог содержит точное время выполнения
4. **Детальная информация:** Включает команду, окружение, длительность
5. **Цветной вывод:** Консоль сохраняет форматирование Jest

### Директория логов

Логи сохраняются в `test-logs/` (уже добавлена в `.gitignore`).

**Рекомендации:**

- Регулярно очищайте старые логи (старше 30 дней)
- Используйте логи для анализа падений тестов
- Сохраняйте логи для CI/CD анализа

### Интеграция с CI/CD

Для CI/CD можно использовать универсальный скрипт:

```yaml
# GitHub Actions example
- name: Run tests with logging
  run: |
      node scripts/run-tests-with-log.js --selectProjects unit --coverage
      # Артефакты автоматически сохраняются в test-logs/

- name: Upload test logs
  uses: actions/upload-artifact@v3
  with:
      name: test-logs
      path: test-logs/
```

#### 4. LDAP/AD тесты (Этап 2)

**Файл:** `scripts/run-ldap-tests-with-log.mjs`

Скрипт для запуска тестов LDAP/AD интеграции с логированием:

- `LDAPClientService` (unit)
- `LDAPProvider` (unit + integration)
- `LDAPRoleSyncService` (unit)

```bash
# Все LDAP тесты с логированием
npm run test:ldap:log

# Только unit тесты
npm run test:ldap:log:unit

# Только integration тесты
npm run test:ldap:log:integration

# С подробным выводом
npm run test:ldap:log:verbose

# С покрытием кода
npm run test:ldap:log:coverage

# С SQL логами (для отладки)
npm run test:ldap:log:debug-sql
```

**Подробная документация:** см. `scripts/LDAP_TESTS_README.md`

## SSO Tests Scripts

См. [SSO_TESTS_README.md](./SSO_TESTS_README.md) для подробной документации по скриптам запуска SSO тестов (Этап 3: SSO Integration).

### Быстрый старт

```bash
# Запустить все SSO тесты с логами
npm run test:sso:log

# Только unit тесты
npm run test:sso:log:unit

# Только integration тесты
npm run test:sso:log:integration

# С покрытием кода
npm run test:sso:log:coverage
```

**Подробная документация:** см. `scripts/SSO_TESTS_README.md`

## Role Mapping Tests Scripts (Этап 4)

Набор скриптов для запуска тестов Role Mapping (Этап 4: Role Mapping) с подробным логированием результатов в файлы.

### Компоненты тестирования

Скрипты запускают unit тесты для следующих компонентов:

- **MappingRuleEngine** — движок для оценки правил маппинга ролей
- **MappingRuleValidator** — валидатор правил маппинга
- **RoleMappingService** — централизованный сервис для применения маппингов

### Доступные скрипты

#### 1. Основной Node.js скрипт

**Файл:** `scripts/run-role-mapping-tests-with-log.mjs`

Основной скрипт для запуска тестов Role Mapping с логированием.

```bash
# Стандартный запуск
node scripts/run-role-mapping-tests-with-log.mjs

# С подробным выводом
node scripts/run-role-mapping-tests-with-log.mjs --verbose

# С покрытием кода
node scripts/run-role-mapping-tests-with-log.mjs --coverage

# В режиме watch (автоматический перезапуск при изменениях)
node scripts/run-role-mapping-tests-with-log.mjs --watch

# С SQL логами (для отладки запросов к БД)
node scripts/run-role-mapping-tests-with-log.mjs --debug-sql
```

#### 2. Bash скрипт (Linux/macOS)

**Файл:** `scripts/run-role-mapping-tests.sh`

Обертка для удобного запуска в Linux/macOS окружении.

```bash
# Стандартный запуск
./scripts/run-role-mapping-tests.sh

# С подробным выводом
./scripts/run-role-mapping-tests.sh --verbose

# С покрытием кода
./scripts/run-role-mapping-tests.sh --coverage

# В режиме watch
./scripts/run-role-mapping-tests.sh --watch

# С SQL логами
./scripts/run-role-mapping-tests.sh --debug-sql
```

#### 3. PowerShell скрипт (Windows)

**Файл:** `scripts/run-role-mapping-tests.ps1`

Обертка для удобного запуска в Windows окружении.

```powershell
# Стандартный запуск
.\scripts\run-role-mapping-tests.ps1

# С подробным выводом
.\scripts\run-role-mapping-tests.ps1 -Verbose

# С покрытием кода
.\scripts\run-role-mapping-tests.ps1 -Coverage

# В режиме watch
.\scripts\run-role-mapping-tests.ps1 -Watch

# С SQL логами
.\scripts\run-role-mapping-tests.ps1 -DebugSql
```

### NPM скрипты

Для удобства использования добавлены npm скрипты в `package.json`:

```bash
# Стандартный запуск unit тестов Role Mapping
npm run test:unit:role-mapping

# Запуск всех Role Mapping тестов (unit)
npm run test:role-mapping

# Запуск с логированием в файл
npm run test:role-mapping:log

# С подробным выводом
npm run test:role-mapping:log:verbose

# С покрытием кода
npm run test:role-mapping:log:coverage

# В режиме watch
npm run test:role-mapping:log:watch

# С SQL логами
npm run test:role-mapping:log:debug-sql
```

### Формат логов

Логи сохраняются в директории `test-logs/` с именами:

- `role-mapping-unit-tests-YYYY-MM-DDTHH-mm-ss.log`

**Структура лога:**

```
=== Role Mapping Tests Execution Log ===
Date: 2024-01-01T12:00:00.000Z
Command: npx jest --selectProjects unit --testPathPatterns mapping-rule-engine.unit.test|mapping-rule-validator.unit.test|role-mapping.service.unit.test
Working Directory: /path/to/project
Node Version: v20.10.0
Platform: win32
============================================================

[полный вывод тестов Jest]

============================================================
Exit Code: 0
Duration: 15.23s
Finished at: 2024-01-01T12:00:15.230Z
============================================================

Test Results:
  Total: 55
  Passed: 55
  Failed: 0
  Success Rate: 100.0%

Test Files:
  1. mapping-rule-engine.unit.test.ts
  2. mapping-rule-validator.unit.test.ts
  3. role-mapping.service.unit.test.ts
```

### Примеры использования

#### Сценарий 1: Стандартный запуск с логированием

```bash
npm run test:role-mapping:log
```

#### Сценарий 2: Отладка падающих тестов

```bash
npm run test:role-mapping:log:verbose
```

#### Сценарий 3: Проверка покрытия кода тестами

```bash
npm run test:role-mapping:log:coverage
```

Откроется HTML отчет с покрытием кода в браузере после завершения тестов.

#### Сценарий 4: Разработка в режиме watch

```bash
npm run test:role-mapping:log:watch
```

Тесты будут автоматически перезапускаться при изменении кода или тестов.

#### Сценарий 5: Отладка SQL запросов

```bash
npm run test:role-mapping:log:debug-sql
```

Включит подробные логи всех SQL запросов к базе данных (полезно для отладки проблем с производительностью или логикой запросов).

### Тестируемые файлы

Скрипты автоматически находят и запускают следующие тестовые файлы:

1. `src/infrastructure/services/role/mapping/tests/mapping-rule-engine.unit.test.ts`
    - Тесты движка оценки правил маппинга
    - Операторы: $eq, $ne, $in, $contains, $startsWith, $endsWith
    - Защита от ReDoS
    - Оценка условий и default ролей

2. `src/infrastructure/services/role/mapping/tests/mapping-rule-validator.unit.test.ts`
    - Тесты валидатора правил маппинга
    - Валидация структуры JSON
    - Проверка операторов и типов
    - Валидация depth и циклических зависимостей

3. `src/infrastructure/services/role/mapping/tests/role-mapping.service.unit.test.ts`
    - Тесты сервиса применения маппингов
    - Применение маппингов к пользователям
    - Обработка приоритетов
    - Default роли
    - Параллельная обработка
    - Детализация ошибок

### Особенности

1. **Подробное логирование:** Все выводы Jest сохраняются в файл
2. **Автоматическая статистика:** Подсчёт пройденных/упавших тестов с процентами
3. **Таймстампы:** Точное время начала и завершения выполнения
4. **Детальная информация:** Команда, окружение, версия Node.js, платформа
5. **Цветной вывод:** Консоль сохраняет форматирование Jest
6. **Кросс-платформенность:** Работает на Windows, Linux, macOS
7. **UTF-8 поддержка:** Корректная обработка русских символов в логах

### Параметры

#### Node.js скрипт (`run-role-mapping-tests-with-log.mjs`)

- `--verbose` — подробный вывод Jest (показывает все describe/it блоки)
- `--coverage` — включить генерацию отчета о покрытии кода
- `--watch` — режим watch (автоматический перезапуск при изменениях)
- `--debug-sql` — включить логирование SQL запросов

#### Bash скрипт (`run-role-mapping-tests.sh`)

- `--verbose` — подробный вывод
- `--coverage` — покрытие кода
- `--watch` — режим watch
- `--debug-sql` — SQL логи

#### PowerShell скрипт (`run-role-mapping-tests.ps1`)

- `-Verbose` — подробный вывод
- `-Coverage` — покрытие кода
- `-Watch` — режим watch
- `-DebugSql` — SQL логи

### Директория логов

Логи сохраняются в `test-logs/` (уже добавлена в `.gitignore`).

**Рекомендации:**

- Регулярно очищайте старые логи (старше 30 дней)
- Используйте логи для анализа падений тестов
- Сохраняйте логи для CI/CD анализа
- Используйте логи для code review и аудита

### Интеграция с CI/CD

Пример использования в GitHub Actions:

```yaml
- name: Run Role Mapping tests
  run: npm run test:role-mapping:log:coverage

- name: Upload test logs
  uses: actions/upload-artifact@v3
  if: always()
  with:
      name: role-mapping-test-logs
      path: test-logs/role-mapping-*.log

- name: Upload coverage
  uses: codecov/codecov-action@v3
  if: always()
  with:
      files: coverage/coverage-final.json
```

### Устранение проблем

#### Ошибка "Permission denied" (Linux/macOS)

```bash
chmod +x scripts/run-role-mapping-tests.sh
chmod +x scripts/run-role-mapping-tests-with-log.mjs
```

#### Ошибка "Execution Policy" (PowerShell)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Проблемы с кодировкой в Windows

Скрипт автоматически устанавливает UTF-8 кодировку. Если проблемы остаются:

```powershell
# Установить кодировку консоли
chcp 65001
npm run test:role-mapping:log
```

#### Тесты не находятся

Убедитесь, что:

- Тестовые файлы находятся в `src/infrastructure/services/role/mapping/tests/`
- Имена файлов соответствуют паттернам: `*.unit.test.ts`
- Jest настроен правильно (проверьте `jest.config.js`)

## External Role Sync Tests Scripts (Этап 5)

Набор скриптов для запуска тестов External Role Sync (Этап 5: Главный сервис синхронизации) с подробным логированием результатов в файлы.

### Компоненты тестирования

Скрипты запускают unit и integration тесты для следующих компонентов:

- **ExternalRoleSyncService** — главный сервис синхронизации внешних систем управления ролями
- **ExternalRoleSyncScheduler** — сервис для управления динамическими cron jobs синхронизации

### Доступные скрипты

#### 1. Основной Node.js скрипт

**Файл:** `scripts/run-external-role-sync-tests-with-log.mjs`

Основной скрипт для запуска тестов External Role Sync с логированием.

```bash
# Все тесты (unit + integration)
node scripts/run-external-role-sync-tests-with-log.mjs

# Только unit тесты
node scripts/run-external-role-sync-tests-with-log.mjs --unit

# Только integration тесты
node scripts/run-external-role-sync-tests-with-log.mjs --integration

# С подробным выводом
node scripts/run-external-role-sync-tests-with-log.mjs --unit --verbose

# С покрытием кода
node scripts/run-external-role-sync-tests-with-log.mjs --unit --coverage

# В режиме watch (автоматический перезапуск при изменениях)
node scripts/run-external-role-sync-tests-with-log.mjs --watch

# С SQL логами (для отладки запросов к БД)
node scripts/run-external-role-sync-tests-with-log.mjs --debug-sql
```

### NPM скрипты

Для удобства использования добавлены npm скрипты в `package.json`:

```bash
# Unit тесты (быстро, без БД)
npm run test:unit:external-role-sync

# Integration тесты (с реальной БД)
npm run test:integration:external-role-sync

# Все тесты (unit + integration)
npm run test:external-role-sync

# Запустить все тесты с логами
npm run test:external-role-sync:log

# Только unit тесты с логами
npm run test:external-role-sync:log:unit

# Только integration тесты с логами
npm run test:external-role-sync:log:integration

# С подробным выводом
npm run test:external-role-sync:log:verbose

# С покрытием кода
npm run test:external-role-sync:log:coverage

# В режиме watch для разработки
npm run test:external-role-sync:log:watch

# С SQL логами
npm run test:external-role-sync:log:debug-sql
```

### Формат логов

Логи сохраняются в директории `test-logs/` с именами:

- `external-role-sync-unit-tests-YYYY-MM-DDTHH-mm-ss.log`
- `external-role-sync-integration-tests-YYYY-MM-DDTHH-mm-ss.log`

**Структура лога:**

```
=== External Role Sync Unit Tests Execution Log ===
Date: 2024-01-01T12:00:00.000Z
Command: npx jest --selectProjects unit --testPathPatterns external-role-sync.*unit.test
Working Directory: /path/to/project
Node Version: v20.10.0
Platform: win32
Test Type: unit
============================================================

[полный вывод тестов Jest]

============================================================
Exit Code: 0
Duration: 15.23s
Finished at: 2024-01-01T12:00:15.230Z
============================================================

Test Results:
  Total: 25
  Passed: 25
  Failed: 0
  Success Rate: 100.0%

Test Files:
  1. external-role-sync.service.unit.test.ts
  2. external-role-sync-scheduler.service.unit.test.ts
```

### Примеры использования

#### Сценарий 1: Запустить все тесты с логами

```bash
npm run test:external-role-sync:log
```

#### Сценарий 2: Запустить только unit тесты с покрытием

```bash
npm run test:external-role-sync:log:unit -- --coverage
```

#### Сценарий 3: Запустить в watch режиме для разработки

```bash
npm run test:external-role-sync:log:watch
```

#### Сценарий 4: Отладка падающих тестов с подробным выводом

```bash
npm run test:external-role-sync:log:verbose
```

#### Сценарий 5: Отладка SQL запросов

```bash
npm run test:external-role-sync:log:debug-sql
```

### Тестируемые файлы

Скрипты автоматически находят и запускают следующие тестовые файлы:

**Unit тесты:**

1. `src/infrastructure/services/role/tests/external-role-sync.service.unit.test.ts`
    - Тесты главного сервиса синхронизации
    - Методы: syncTenant, syncAllTenants, getSyncStatus, retryFailedSync
    - Управление синхронизацией: pauseSync, resumeSync, testConnection
    - Интеграция с MetricsCollector и AuditService

2. `src/infrastructure/services/role/tests/external-role-sync-scheduler.service.unit.test.ts`
    - Тесты сервиса планировщика cron jobs
    - Динамическое создание/обновление/удаление cron jobs
    - Валидация cron выражений
    - Инициализация при старте приложения

**Integration тесты:**

1. `src/infrastructure/services/role/tests/external-role-sync.service.integration.test.ts`
    - Интеграционные тесты с реальной БД
    - Полный цикл синхронизации
    - Проверка tenant isolation
    - Проверка метрик и audit логов

2. `src/infrastructure/services/role/tests/external-role-sync-scheduler.service.integration.test.ts`
    - Интеграционные тесты планировщика
    - Проверка выполнения scheduled синхронизаций
    - Проверка обновления cron jobs

### Особенности

1. **Подробное логирование:** Все выводы Jest сохраняются в файл
2. **Автоматическая статистика:** Подсчёт пройденных/упавших тестов с процентами
3. **Таймстампы:** Точное время начала и завершения выполнения
4. **Детальная информация:** Команда, окружение, версия Node.js, платформа
5. **Цветной вывод:** Консоль сохраняет форматирование Jest
6. **Кросс-платформенность:** Работает на Windows, Linux, macOS
7. **UTF-8 поддержка:** Корректная обработка русских символов в логах
8. **Разделение unit/integration:** Возможность запускать тесты отдельно

### Параметры

#### Node.js скрипт (`run-external-role-sync-tests-with-log.mjs`)

- `--unit` — запустить только unit тесты
- `--integration` — запустить только integration тесты
- `--verbose` — подробный вывод Jest (показывает все describe/it блоки)
- `--coverage` — включить генерацию отчета о покрытии кода
- `--watch` — режим watch (автоматический перезапуск при изменениях)
- `--debug-sql` — включить логирование SQL запросов

### Директория логов

Логи сохраняются в `test-logs/` (уже добавлена в `.gitignore`).

**Рекомендации:**

- Регулярно очищайте старые логи (старше 30 дней)
- Используйте логи для анализа падений тестов
- Сохраняйте логи для CI/CD анализа
- Используйте логи для code review и аудита

### Интеграция с CI/CD

Пример использования в GitHub Actions:

```yaml
- name: Run External Role Sync tests
  run: npm run test:external-role-sync:log:coverage

- name: Upload test logs
  uses: actions/upload-artifact@v3
  if: always()
  with:
      name: external-role-sync-test-logs
      path: test-logs/external-role-sync-*.log

- name: Upload coverage
  uses: codecov/codecov-action@v3
  if: always()
  with:
      files: coverage/coverage-final.json
```

## Поддержка

При возникновении проблем:

1. Проверьте права доступа
2. Убедитесь в корректности пути к скриптам
3. Проверьте версию PowerShell (для Windows)
4. Убедитесь в наличии bash (для Linux/macOS)
5. Убедитесь, что директория `test-logs/` существует (создаётся автоматически)
