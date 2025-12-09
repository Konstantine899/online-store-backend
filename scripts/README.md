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

## Поддержка

При возникновении проблем:
1. Проверьте права доступа
2. Убедитесь в корректности пути к скриптам
3. Проверьте версию PowerShell (для Windows)
4. Убедитесь в наличии bash (для Linux/macOS)
5. Убедитесь, что директория `test-logs/` существует (создаётся автоматически)
