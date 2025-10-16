# Test Utilities

Переиспользуемые компоненты для тестов проекта online-store-backend.

## Модули

### TestDataFactory

Генерация уникальных тестовых данных для предотвращения race conditions.

**Методы:**

- `uniqueEmail()` - уникальный email адрес
- `uniquePhone()` - уникальный российский телефон
- `createUserDto(overrides)` - DTO для создания пользователя
- `randomFirstName()` - случайное имя
- `randomLastName()` - случайная фамилия
- `createAddress(overrides)` - генерация адреса

**Пример:**

```typescript
import { TestDataFactory } from '../utils';

const email = TestDataFactory.uniqueEmail();
const phone = TestDataFactory.uniquePhone();
const userDto = TestDataFactory.createUserDto({ firstName: 'Иван' });
```

---

### TestCleanup

Централизованная очистка БД для изоляции тестов.

**Методы:**

- `cleanUsers(sequelize)` - очистка временных пользователей (id > 14)
- `resetUser13(sequelize)` - сброс user 13 к дефолтным значениям
- `cleanUser13Addresses(sequelize)` - очистка адресов user 13
- `cleanAuthData(sequelize)` - очистка login_history + refresh_token
- `cleanOrders(sequelize)` - очистка заказов
- `cleanCarts(sequelize)` - очистка корзин
- `cleanAll(sequelize)` - полная очистка всех данных

**Пример:**

```typescript
import { TestCleanup } from '../utils';

afterEach(async () => {
    const sequelize = app.get(Sequelize);
    await TestCleanup.resetUser13(sequelize);
    await TestCleanup.cleanUsers(sequelize);
});
```

---

### TestTransaction

Изоляция тестов через транзакции с автоматическим rollback.

**Методы:**

- `start(sequelize)` - начать транзакцию
- `rollback(transaction)` - откатить транзакцию
- `run(sequelize, testFn)` - запустить функцию в транзакции с auto-rollback
- `suite(getSequelize)` - wrapper для test suite

**Пример 1: Базовый**

```typescript
import { TestTransaction } from '../utils';

let transaction: Transaction;

beforeEach(async () => {
    const sequelize = app.get(Sequelize);
    transaction = await TestTransaction.start(sequelize);
});

afterEach(async () => {
    await TestTransaction.rollback(transaction);
});
```

**Пример 2: Wrapper функция**

```typescript
it('test with auto rollback', async () => {
    await TestTransaction.run(sequelize, async (transaction) => {
        // Все изменения откатятся автоматически
        await userRepository.create(
            { email: 'test@test.com' },
            { transaction },
        );
    });
});
```

**Пример 3: Suite wrapper**

```typescript
describe('My isolated suite', () => {
    const { beforeEach, afterEach } = TestTransaction.suite(() => app.get(Sequelize));

    beforeEach();
    afterEach();

    it('test 1', async () => { ... });
    it('test 2', async () => { ... });
});
```

**Когда использовать:**

- ✅ Тесты с большим количеством изменений БД
- ✅ Нужна гарантия полного отката
- ✅ Быстрая изоляция без ручного cleanup

**Когда НЕ использовать:**

- ❌ Тесты с вложенными транзакциями в коде
- ❌ Тесты с commit внутри
- ❌ DDL операции (ALTER TABLE и т.п.)

---

## Лучшие практики

### Выбор метода изоляции

1. **TestCleanup** (текущий подход)
    - ✅ Простой и понятный
    - ✅ Работает всегда
    - ✅ Видны изменения в БД
    - ⚠️ Медленнее транзакций
    - **Использовать для:** большинства integration тестов

2. **TestTransaction**
    - ✅ Быстрее cleanup
    - ✅ Полная изоляция
    - ⚠️ Не работает с вложенными транзакциями
    - ⚠️ Сложнее debugging
    - **Использовать для:** unit тестов репозиториев, изолированных сервисов

3. **Комбинированный подход**
    - TestTransaction для быстрых unit тестов
    - TestCleanup для integration тестов
    - **Лучший вариант для проекта**

---

### MockFactories

Стандартизированные моки для unit тестов сервисов и репозиториев.

**Методы:**

- `createCartRepository()` - мок CartRepository
- `createProductRepository()` - мок ProductRepository
- `createPromoCodeRepository()` - мок PromoCodeRepository
- `createPromoCodeService()` - мок PromoCodeService
- `createTenantContext(tenantId)` - мок TenantContext
- `createCartModel(overrides)` - мок CartModel
- `createProductModel(overrides)` - мок ProductModel
- `createMockRequest(overrides)` - мок Request объекта
- `createMockResponse()` - мок Response объекта
- `createMockTransaction()` - мок Sequelize транзакции
- `createCartServiceProviders(config)` - полный набор провайдеров

**Константы:**

- `CART_TEST_CONSTANTS` - стандартные значения для тестов корзины

**Пример:**

```typescript
import { MockFactories, CART_TEST_CONSTANTS } from '../utils';

// Создание отдельных моков
const mockCartRepository = MockFactories.createCartRepository();
const mockCart = MockFactories.createCartModel({ id: 2 });

// Создание полного набора провайдеров
const providers = MockFactories.createCartServiceProviders({
    tenantId: 2,
    mockCart: { id: 2, user_id: 5 },
});

// Использование констант
const { PRODUCT_PRICE, CART_ID } = CART_TEST_CONSTANTS;
```

---

## Структура utilities

```
tests/utils/
├── index.ts                  # Barrel exports
├── test-data-factory.ts      # Генерация данных
├── test-cleanup.ts           # Cleanup методы
├── test-transaction.ts       # Транзакционная изоляция
├── mock-factories.ts         # Стандартизированные моки
└── README.md                 # Документация
```
