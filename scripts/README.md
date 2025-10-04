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

## Поддержка

При возникновении проблем:
1. Проверьте права доступа
2. Убедитесь в корректности пути к скриптам
3. Проверьте версию PowerShell (для Windows)
4. Убедитесь в наличии bash (для Linux/macOS)
