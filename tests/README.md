# Тесты

Эта директория содержит тесты для проекта online-store-backend.

## Структура

```
tests/
├── setup/                    # Настройки для тестов
│   ├── env.setup.ts         # Переменные окружения
│   ├── global.setup.ts      # Глобальные настройки
│   ├── unit.setup.ts        # Настройки для unit тестов
│   └── integration.setup.ts # Настройки для интеграционных тестов
├── integration/              # Интеграционные тесты
│   └── rate-limiting.test.js
└── README.md                # Этот файл
```

## Настройка

1. Скопируйте файл с примером переменных окружения:
   ```bash
   cp .test.env.example .test.env
   ```

2. Настройте тестовую базу данных в `.test.env`

3. Убедитесь, что тестовая БД создана и миграции применены

## Запуск тестов

### Все тесты
```bash
npm test
```

### Unit тесты
```bash
npm run test:unit
npm run test:unit:watch
npm run test:cov:unit
```

### Интеграционные тесты
```bash
npm run test:integration
npm run test:integration:watch
npm run test:cov:integration
```

### Coverage
```bash
npm run test:cov
```

## Типы тестов

### Unit тесты
- Располагаются рядом с тестируемым кодом: `src/**/*.spec.ts`
- Тестируют отдельные функции/классы изолированно
- Используют моки для внешних зависимостей

### Интеграционные тесты
- Располагаются в `tests/integration/`
- Тестируют взаимодействие компонентов
- Могут использовать реальную БД и HTTP запросы

## Существующие тесты

### Rate Limiting Test
Тестирует работу rate limiting и bruteforce защиты для auth роутов.

**Запуск:**
```bash
# Убедитесь, что сервер запущен
npm run start:dev

# В другом терминале запустите тест
node tests/integration/rate-limiting.test.js
```

**Что тестирует:**
- Логин: 5 попыток в 15 минут
- Refresh: 10 попыток в 5 минут  
- Регистрация: 3 попытки в минуту

## Добавление новых тестов

### Unit тесты
1. Создайте файл `*.spec.ts` рядом с тестируемым кодом
2. Используйте Jest и NestJS Testing utilities

### Интеграционные тесты
1. Создайте файл `*.test.ts` в `tests/integration/`
2. Используйте Supertest для HTTP запросов
3. Размещайте тесты в соответствующих поддиректориях

## Утилиты для тестов

Доступны глобальные утилиты:
- `testUtils.generateRandomEmail()` - генерация случайного email
- `testUtils.generateRandomString()` - генерация случайной строки
- `testUtils.generateTestUser()` - генерация тестового пользователя
- `testUtils.delay(ms)` - задержка выполнения
