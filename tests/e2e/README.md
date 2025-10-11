# E2E Tests

## Назначение

End-to-End (E2E) тесты проверяют **полные пользовательские сценарии** от начала до конца без моков.

## Отличия от Integration тестов

| Характеристика | Integration Tests               | E2E Tests                             |
| -------------- | ------------------------------- | ------------------------------------- |
| **Scope**      | Один контроллер/сервис          | Полный user journey                   |
| **Моки**       | Некоторые внешние зависимости   | Минимальные (только внешние API)      |
| **Timeout**    | 30s                             | 60s                                   |
| **Execution**  | Parallel (локально: sequential) | Sequential                            |
| **Coverage**   | Да (строгие thresholds)         | Нет (фокус на функциональности)       |
| **Data**       | Minimal seeds                   | Full seed data (products, categories) |

## Структура

```
tests/e2e/
├── README.md                    # Этот файл
├── user-journey.e2e.test.ts     # Пользовательский journey
├── admin-journey.e2e.test.ts    # Админский journey
└── seeds/                       # E2E seed данные (опционально)
    ├── categories.json
    ├── brands.json
    └── products.json
```

## Запуск

```bash
# Все E2E тесты
npm run test:e2e

# Конкретный E2E файл
npm run test:e2e -- user-journey.e2e.test.ts

# С verbose output
npm run test:e2e -- --verbose
```

## E2E Scenarios

### 1. User Journey

**Цель:** Проверить полный flow обычного пользователя

**Steps:**

1. Registration (email, password, phone)
2. Email Verification (код из БД)
3. Login (access + refresh tokens)
4. Profile Setup (firstName, lastName, address)
5. Browse Products (categories, brands, filters)
6. Add to Cart (quantity, price calculation)
7. Checkout (address, payment method)
8. Order Confirmation (order created, email sent)
9. Track Order (order status)

**Expected:** Пользователь может полностью пройти от регистрации до получения заказа

### 2. Admin Journey

**Цель:** Проверить административные функции

**Steps:**

1. Admin Login (admin credentials)
2. View Users (pagination, filters)
3. Create Product (category, brand, price, stock)
4. Update Product (price change, stock adjustment)
5. View Orders (all users)
6. Update Order Status (processing → shipped → delivered)

**Expected:** Админ может управлять пользователями, продуктами и заказами

## Best Practices

### ✅ DO:

- Использовать TestDataFactory для генерации уникальных данных
- Cleanup в afterEach/afterAll (TestCleanup utility)
- Проверять критичные бизнес-требования (цены, количество, статусы)
- Тестировать happy path И edge cases
- Использовать descriptive test names

### ❌ DON'T:

- Hardcoded user IDs (генерировать unique users)
- Shared mutable state между тестами
- Skip тестов без причины
- Моки для внутренних сервисов (только внешние API)
- Флакающие тесты (фиксировать root cause)

## Troubleshooting

### E2E тесты медленные

- ✅ Норма, E2E медленнее integration
- Sequential execution (maxWorkers: 1)
- Timeout 60s

### E2E тесты падают с timeout

- Проверить БД connection (порт 3308, MySQL running)
- Увеличить timeout в jest.e2e.config.js
- Проверить seed данные (должны быть minimal)

### Race conditions в E2E

- E2E тесты должны быть sequential (maxWorkers: 1)
- Использовать unique users (TestDataFactory)
- Cleanup после каждого теста

## E2E Seed Data

E2E тесты требуют **минимальные seed данные**:

```bash
# Применить E2E seeds (если есть)
npm run db:seed:e2e

# Или использовать обычные seeds
npm run db:seed:test
```

**Required seeds:**

- Roles (ADMIN, USER)
- Categories (1-2 для тестов)
- Brands (1-2 для тестов)
- Products (3-5 для shopping flow)

## CI/CD Integration

E2E тесты **не запускаются в CI** по умолчанию (слишком медленные).

Для включения в CI:

```yaml
# .github/workflows/ci.yml
- name: E2E Tests
  run: npm run test:e2e
  timeout-minutes: 15
```

## Metrics

**Target:**

- Минимум 5 E2E тестов
- 100% критичных user flows
- < 5 минут execution time

**Current:** (будет обновлено)
