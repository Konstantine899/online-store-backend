# Testing Strategy - Online Store Backend

## 📋 Оглавление

- [Типы тестов](#типы-тестов)
- [Execution Strategy](#execution-strategy)
- [Integration Tests](#integration-tests)
- [Локальная разработка](#локальная-разработка)
- [CI/CD](#cicd)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Типы тестов

### 1. Unit Tests
**Цель:** Изолированное тестирование сервисов, пайпов, гвардов, валидаторов  
**Запуск:** `npm run test:unit`  
**Скорость:** ~3-5 секунд (быстрые)  
**Зависимости:** Все внешние зависимости мокируются

**Примеры:**
- `auth.service.unit.test.ts` - бизнес-логика аутентификации
- `bruteforce.guard.unit.test.ts` - rate limiting логика
- `sanitize-string.validator.unit.test.ts` - XSS защита

### 2. Integration Tests
**Цель:** Тестирование взаимодействия компонентов через HTTP API  
**Запуск:** `npm run test:integration` (локально)  
**Скорость:** ~30-40 секунд (медленнее)  
**Зависимости:** Реальная БД, реальный HTTP слой

**Примеры:**
- `auth.controller.integration.test.ts` - полный auth flow
- `input-validation.integration.test.ts` - DTO валидация + security
- `rbac.integration.test.ts` - проверка ролей и доступа

---

## Execution Strategy

### 🎯 Hybrid Approach

Мы используем **гибридный подход** для оптимального баланса между стабильностью и скоростью:

| Окружение | Стратегия | Workers | Время | Стабильность |
|-----------|-----------|---------|-------|--------------|
| **Локально** | Sequential | 1 | ~30-40s | ✅ 100% |
| **CI/CD** | Parallel | 4 | ~15-20s | ✅ 100% |

**Причина:**
- Локальные MySQL instances имеют ограниченный connection pool
- CI использует оптимизированную БД с увеличенными лимитами

---

## Integration Tests

### Локальная разработка

```bash
# Подготовка БД (первый раз или после изменений миграций)
npm run test:setup

# Запуск всех integration тестов (sequential)
npm run test:integration

# Запуск конкретного файла
npm run test:integration -- src/infrastructure/controllers/auth/tests/auth.controller.integration.test.ts

# Watch mode
npm run test:integration:watch

# С coverage
npm run test:cov:integration
```

**Конфигурация:**
- `maxWorkers: 1` - один test suite за раз
- `testTimeout: 30000` - 30 секунд на тест
- Connection pool: `max: 10, min: 2`

**Требования:**
- MySQL running на `localhost:3308`
- Database: `online_store_test`
- User: `test_user` / Pass: `TestPass123!`

---

### CI/CD

```bash
# В GitHub Actions / GitLab CI
npm run test:integration:ci

# С coverage
npm run test:cov:integration:ci
```

**Конфигурация:**
- `maxWorkers: 4` - 4 параллельных workers
- `CI=true` env переменная
- Connection pool: `max: 30, min: 10` (через ENV override)

**ENV Variables для CI:**
```yaml
env:
  CI: true
  NODE_ENV: test
  MYSQL_HOST: 127.0.0.1
  MYSQL_PORT: 3306
  MYSQL_DATABASE: online_store_test
  MYSQL_USER: root
  MYSQL_PASSWORD: root
  SEQUELIZE_POOL_MAX: 30        # ← Увеличенный pool для parallel
  SEQUELIZE_POOL_MIN: 10
  JWT_ACCESS_SECRET: ci_test_secret
  JWT_REFRESH_SECRET: ci_test_refresh
  UPLOAD_PATH: ./uploads/test
```

**MySQL Service (GitHub Actions пример):**
```yaml
services:
  mysql:
    image: mysql:8.0
    env:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: online_store_test
    ports:
      - 3306:3306
    options: >-
      --health-cmd="mysqladmin ping"
      --health-interval=10s
      --health-timeout=5s
      --health-retries=5
      --max-connections=200        # ← Важно!
```

---

## Troubleshooting

### Проблема 1: `Unknown database 'online_store_test'`

**Причина:** База данных не создана или не применены миграции

**Решение:**
```bash
npm run test:setup
# Или полный сброс
npm run db:reset:test
```

---

### Проблема 2: `Role USER/ADMIN not found in database`

**Причина:** Seeds не применены

**Решение:**
```bash
npm run db:seed:test
# Или через setup
npm run test:setup
```

---

### Проблема 3: Connection pool exhausted

**Симптомы:**
```
Error: Too many connections
Error: Acquiring client from pool timeout
```

**Решение локально:**
```bash
# Используйте sequential execution
npm run test:integration  # уже использует --runInBand
```

**Решение в CI:**
```yaml
# Увеличьте pool limits
env:
  SEQUELIZE_POOL_MAX: 50
  SEQUELIZE_POOL_MIN: 15
```

---

### Проблема 4: Тесты падают при параллельном запуске

**Причина:** Race conditions в `beforeAll`/`afterAll`

**Решение:**
```bash
# Запустите с одним worker
npm run test:integration -- --runInBand

# Или используйте debug mode
npm run test:debug
```

---

### Проблема 5: Memory leaks / Open handles

**Симптомы:**
```
A worker process has failed to exit gracefully
Jest did not exit one second after the test run has completed
```

**Диагностика:**
```bash
npm run test:debug
# Покажет незакрытые handles
```

**Решение:**
- Убедитесь что все `app.close()` вызываются в `afterAll`
- Проверьте что нет забытых `setTimeout`/`setInterval`
- Используйте `jest.useFakeTimers()` для тестов с таймерами

---

## Best Practices

### 1. Изоляция тестов

**✅ DO:**
```typescript
describe('My Feature', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await setupTestApp();
    });

    afterAll(async () => {
        await app?.close();  // ← Обязательно!
    });

    it('should work', async () => {
        // Тест
    });
});
```

**❌ DON'T:**
```typescript
// Переиспользование app между describe blocks
let globalApp: INestApplication;

describe('Feature 1', () => {
    // использует globalApp
});

describe('Feature 2', () => {
    // использует тот же globalApp - BAD!
});
```

---

### 2. Подготовка данных

**✅ DO:**
```typescript
// Используйте TestDataFactory для создания тестовых данных
const { token, userId } = await TestDataFactory.createUserWithRole(app, 'USER');
```

**❌ DON'T:**
```typescript
// Прямые SQL запросы или hardcoded IDs
await sequelize.query('INSERT INTO user ...');
const userId = 1; // Может конфликтовать с другими тестами
```

---

### 3. Очистка данных

**✅ DO:**
```typescript
afterAll(async () => {
    // Удаляем только созданные тестом данные
    await TestCleanup.cleanUsers(app);
    await app?.close();
});
```

**❌ DON'T:**
```typescript
afterAll(async () => {
    // Не используйте TRUNCATE (удаляет seeds!)
    await sequelize.query('TRUNCATE TABLE user');
});
```

---

### 4. Rate Limiting в тестах

**Проблема:** BruteforceGuard блокирует тесты при множественных запросах

**Решение 1:** Bypass guard (для тестов НЕ связанных с rate limiting)
```typescript
beforeAll(async () => {
    app = await setupTestApp();  // ← Guard отключен
});
```

**Решение 2:** Использовать guard (для brute force тестов)
```typescript
beforeAll(async () => {
    app = await setupTestAppWithRateLimit();  // ← Guard активен
});
```

**Решение 3:** Уникальные IP для каждого запроса
```typescript
const getUniqueHeaders = () => ({
    'x-forwarded-for': `10.0.${Math.floor(counter / 255)}.${counter++ % 255}`,
});

const response = await request(app.getHttpServer())
    .post('/endpoint')
    .set(getUniqueHeaders())  // ← Обход rate limiting
    .send(data);
```

---

### 5. Coverage Requirements

**Глобальные пороги:**
```javascript
coverageThreshold: {
    global: {
        branches: 50,
        functions: 50,
        lines: 50,
        statements: 50
    }
}
```

**Критичные модули (≥80%):**
- `src/infrastructure/services/auth/`
- `src/infrastructure/common/guards/`
- `src/infrastructure/common/pipes/`
- `src/infrastructure/common/validators/`

**Проверка:**
```bash
npm run test:cov:integration
# Откроется coverage/index.html
```

---

## Команды тестирования

### Все тесты
```bash
npm test                    # Запустить все (unit + integration)
npm run test:watch          # Watch mode
npm run test:cov            # С coverage
```

### Unit тесты
```bash
npm run test:unit           # Все unit тесты
npm run test:unit:watch     # Watch mode
npm run test:cov:unit       # С coverage
```

### Integration тесты
```bash
# Локально (sequential, стабильно)
npm run test:integration         # Все integration тесты
npm run test:integration:watch   # Watch mode
npm run test:cov:integration     # С coverage

# CI (parallel, быстро)
npm run test:integration:ci      # 4 workers
npm run test:cov:integration:ci  # 4 workers + coverage
```

### Debug
```bash
npm run test:debug          # С detectOpenHandles
npm run test:debug -- --testNamePattern="конкретный тест"
```

---

## Файловая структура тестов

```
online-store-backend/
├── tests/
│   ├── setup/
│   │   ├── app.ts              # setupTestApp, setupTestAppWithRateLimit
│   │   └── test-app.module.ts  # TestAppModule
│   ├── utils/
│   │   ├── test-data-factory.ts  # Создание тестовых данных
│   │   └── test-cleanup.ts       # Очистка после тестов
│   └── jest-setup.ts             # Глобальная конфигурация
│
├── src/
│   └── infrastructure/
│       ├── controllers/
│       │   └── auth/
│       │       └── tests/
│       │           ├── auth.controller.integration.test.ts
│       │           └── auth-bruteforce.integration.test.ts
│       ├── common/
│       │   ├── guards/
│       │   │   └── tests/
│       │   │       ├── bruteforce.guard.unit.test.ts
│       │   │       └── rbac.integration.test.ts
│       │   └── pipes/
│       │       └── tests/
│       │           └── input-validation.integration.test.ts
│       └── services/
│           └── auth/
│               └── auth.service.unit.test.ts
```

**Правило:** Тесты располагаются рядом с тестируемым кодом в подпапке `tests/`

---

## Phase 2: Auth & Security Tests

### Текущий статус: ✅ COMPLETE

| Test Suite | Тесты | Coverage | Статус |
|------------|-------|----------|--------|
| TEST-010: Auth Flow | 40/40 | 96.1% | ✅ |
| TEST-011: Brute Force | 46/46 | 98.65% | ✅ |
| TEST-012: Input Validation | 32/32 | 100% | ✅ |
| **ИТОГО Phase 2** | **118/118** | **96-100%** | ✅ |

**Запуск Phase 2 тестов:**
```bash
npm run test:integration -- src/infrastructure/controllers/auth/tests src/infrastructure/common/guards/tests src/infrastructure/common/pipes/tests
```

---

## Известные ограничения

### 1. Parallel Execution локально

**Проблема:** При параллельном запуске ВСЕХ integration тестов (15 suites) возникают конфликты connection pools.

**Симптомы:**
```
Error: Unknown database 'online_store_test'
Error: Role USER not found in database
Error: ER_NO_REFERENCED_ROW_2
```

**Решение:** Используйте sequential execution локально
```bash
npm run test:integration  # Уже включает --runInBand
```

**Статус:** ✅ Решено через Hybrid Strategy

---

### 2. TestDataFactory race conditions

**Проблема:** В параллельных тестах `RoleModel.findOne()` может вернуть `null` если seeds еще не загружены.

**Решение:** Добавлен retry logic в `createUserInDB()`
```typescript
// Retry до 3 раз с экспоненциальной задержкой
for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 100 * attempt));
    role = await RoleModel.findOne({ where: { role: roleName } });
    if (role) break;
}
```

**Статус:** ✅ Исправлено в v0.0.1

---

### 3. Graceful Shutdown

**Проблема:** Connection pools не закрываются корректно между test suites, вызывая утечки.

**Решение:** `addGracefulShutdown()` в `setupTestApp()`
```typescript
app.close = async () => {
    await sequelize.connectionManager.close(); // ← Закрываем pool
    await originalClose();
};
```

**Статус:** ✅ Исправлено в v0.0.1

---

## CI/CD Requirements

### GitHub Actions (пример)

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: online_store_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
          --max-connections=200
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      
      - name: Setup test database
        run: npm run test:setup
        env:
          MYSQL_HOST: 127.0.0.1
          MYSQL_PORT: 3306
          MYSQL_USER: root
          MYSQL_PASSWORD: root
      
      - name: Run Integration Tests
        env:
          CI: true
          SEQUELIZE_POOL_MAX: 30
          SEQUELIZE_POOL_MIN: 10
        run: npm run test:integration:ci
```

---

## Connection Pool Configuration

### Адаптивная конфигурация

**Файл:** `src/infrastructure/config/sequelize/sql.config.ts`

```typescript
const getPoolConfig = () => {
    const isCI = process.env.CI === 'true';
    const isTestEnv = process.env.NODE_ENV === 'test';

    // Приоритет: ENV переменные (CI) > defaults
    if (process.env.SEQUELIZE_POOL_MAX) {
        return {
            max: parseInt(process.env.SEQUELIZE_POOL_MAX),
            min: parseInt(process.env.SEQUELIZE_POOL_MIN || '5'),
            acquire: 60000,
            idle: 10000,
        };
    }

    // Defaults по окружению
    if (isTestEnv) {
        return {
            max: isCI ? 30 : 10,
            min: isCI ? 10 : 2,
            acquire: 30000,
            idle: 10000,
        };
    }

    // Production
    return {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 10000,
    };
};
```

**Параметры:**
- `max` - максимум одновременных соединений
- `min` - минимум поддерживаемых соединений
- `acquire` - таймаут получения соединения (ms)
- `idle` - время до закрытия неактивного соединения (ms)

---

## Best Practices

### 1. Один describe = один test suite

```typescript
// ✅ GOOD
describe('Auth Flow (integration)', () => {
    let app: INestApplication;
    
    beforeAll(async () => {
        app = await setupTestApp();
    });
    
    afterAll(async () => {
        await app?.close();
    });
    
    it('should register', async () => { /* ... */ });
    it('should login', async () => { /* ... */ });
});
```

---

### 2. Изолируйте тестовые данные

```typescript
// ✅ GOOD: Каждый тест создает свои данные
it('should update user', async () => {
    const { userId, token } = await TestDataFactory.createUserWithRole(app, 'USER');
    // Тест с userId
});

// ❌ BAD: Переиспользование данных между тестами
let sharedUserId: number;

beforeAll(() => {
    sharedUserId = 1; // Может конфликтовать
});
```

---

### 3. Используйте правильный setupTestApp

```typescript
// Для большинства тестов (guard отключен)
const app = await setupTestApp();

// Только для brute force тестов (guard активен)
const app = await setupTestAppWithRateLimit();
```

---

### 4. Проверяйте формат ошибок

```typescript
// ✅ GOOD: Проверяем контракт ошибок
expect(response.status).toBe(400);
expect(response.body).toMatchObject({
    status: 400,
    message: expect.any(String),
});

// ❌ BAD: Только статус код
expect(response.status).toBe(400);
```

---

### 5. Negative Testing обязателен

Для каждого happy path теста должен быть минимум 1 negative:

```typescript
describe('POST /auth/login', () => {
    it('200: successful login', async () => { /* ... */ });
    
    // Negative cases
    it('401: wrong password', async () => { /* ... */ });
    it('401: non-existent email', async () => { /* ... */ });
    it('400: invalid email format', async () => { /* ... */ });
    it('429: too many attempts', async () => { /* ... */ });
});
```

---

## FAQ

### Q: Почему integration тесты медленнее unit?
**A:** Integration тесты запускают реальный NestJS app с БД, HTTP слоем, DI контейнером. Unit тесты мокируют всё это.

### Q: Можно ли запустить один конкретный тест?
**A:** Да, используйте `--testNamePattern`:
```bash
npm run test:integration -- --testNamePattern="should login"
```

### Q: Как ускорить тесты локально?
**A:** Запускайте только нужные test suites:
```bash
npm run test:integration -- src/infrastructure/controllers/auth/tests
```

### Q: Что делать если тесты флакают (нестабильны)?
**A:** 
1. Запустите `npm run test:debug` для диагностики
2. Проверьте изоляцию данных (каждый тест создает свои данные?)
3. Убедитесь что нет race conditions в `beforeAll`
4. Используйте `--runInBand` для sequential execution

### Q: Как добавить новый integration тест?
**A:**
1. Создайте файл `*.integration.test.ts` рядом с тестируемым кодом
2. Используйте `setupTestApp()` в `beforeAll`
3. Обязательно `await app?.close()` в `afterAll`
4. Используйте `TestDataFactory` для данных
5. Запустите `npm run test:integration` для проверки

---

## Метрики производительности

### Baseline (v0.0.1)

| Метрика | Локально | CI |
|---------|----------|-----|
| Unit tests | ~5s | ~3s |
| Integration tests | ~30-40s | ~15-20s |
| Total | ~35-45s | ~18-23s |
| Workers | 1 | 4 |
| Connection pool | 10 max | 30 max |

### Цель (future)

- Локально: ≤40s (приемлемо для dev)
- CI: ≤20s (оптимизация для быстрого feedback)

---

## Дополнительные ресурсы

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Sequelize Pool](https://sequelize.org/docs/v6/other-topics/connection-pool/)
- [Supertest](https://github.com/visionmedia/supertest)

---

**Последнее обновление:** 2025-10-09  
**Версия:** 0.0.1  
**Автор:** Development Team

