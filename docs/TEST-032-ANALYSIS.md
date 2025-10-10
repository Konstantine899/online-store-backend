# TEST-032: Race Condition & Concurrency Tests - Детальный анализ

## 🎯 Контекст

**Задача:** Протестировать и выявить критичные race conditions в backend
**Scope:** Inventory, Cart, Order, Payment, User Profile
**Estimate:** 10-14 hours
**Priority:** HIGH (критичный модуль: concurrency/transactions)

---

## 🔍 Анализ текущего кода

### 1. ❌ **Inventory Race Conditions (CRITICAL)**

**Проблема:** Отсутствует проверка и декремент `stock` при создании заказа

#### Код:

```typescript
// src/infrastructure/services/order/order.service.ts:169
const order = await this.orderRepository.createOrder(dto, userId);
// ❌ НЕТ проверки product.stock
// ❌ НЕТ декремента stock
// ❌ НЕТ транзакции
```

#### Модель Product:

```typescript
// src/domain/models/product.model.ts:41
stock: number; // ✅ Поле есть, но НЕ используется
```

#### Race Condition Scenario:

```
User A: GET /products/1 → stock: 1 ✅
User B: GET /products/1 → stock: 1 ✅

User A: POST /order → create order (stock: 1) ✅
User B: POST /order → create order (stock: 1) ✅  // ❌ ПРОБЛЕМА!

Result: 2 заказа, 1 товар на складе → Overselling!
```

#### Решение:

- Pessimistic locking: `SELECT ... FOR UPDATE`
- Atomic decrement: `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`
- Транзакция для всей операции order creation

---

### 2. ❌ **Cart Concurrent Updates (HIGH)**

**Проблема:** Нет защиты от concurrent add/increment/decrement

#### Код:

```typescript
// src/infrastructure/services/cart/cart.service.ts:63
const cart = await this.cartRepository.appendToCart(
    foundCart.id,
    product.id,
    quantity,
);
// ❌ НЕТ транзакции
// ❌ НЕТ locking
```

#### Race Condition Scenario:

```
User: Clicks "+" twice quickly
Request A: INCREMENT product_id=1, quantity=1
Request B: INCREMENT product_id=1, quantity=1

// Without locking:
A: READ quantity = 5
B: READ quantity = 5
A: WRITE quantity = 6
B: WRITE quantity = 6  // ❌ Lost update! Should be 7
```

#### Решение:

- Row-level locking: `findOne({ lock: Transaction.LOCK.UPDATE })`
- Atomic operations: `UPDATE cart_product SET quantity = quantity + ?`

---

### 3. ❌ **Payment Double-Charge (CRITICAL)**

**Проблема:** Неправильная реализация idempotency

#### Код:

```typescript
// src/infrastructure/services/payment/payment.service.ts:35
'Idempotence-Key': Date.now(),
// ❌ ПРОБЛЕМА: Date.now() ВСЕГДА разный!
```

#### Race Condition Scenario:

```
User: Clicks "Pay" twice (double-click or network issue)

Request A: Idempotence-Key: 1696780001234
Request B: Idempotence-Key: 1696780001235  // ❌ Разные ключи!

Result: 2 платежа на одну и ту же сумму!
```

#### Решение:

```typescript
// Правильно:
'Idempotence-Key': `order-${orderId}-${userId}-payment`
// Один orderId = один payment
```

---

### 4. ⚠️ **User Profile Concurrent Updates (MEDIUM)**

**Проблема:** Lost updates при параллельных обновлениях профиля

#### Код:

```typescript
// src/infrastructure/services/user/user.service.ts:266
const foundUser = await this.userRepository.findUser(id);
// ...
updatedUser = await this.userRepository.updateUser(foundUser, dto);
// ❌ НЕТ locking между read и update
```

#### Race Condition Scenario:

```
Admin A: PATCH /user/1 { firstName: "John" }
Admin B: PATCH /user/1 { lastName: "Doe" }

A: READ user → { firstName: "Ivan", lastName: "Petrov" }
B: READ user → { firstName: "Ivan", lastName: "Petrov" }
A: WRITE { firstName: "John", lastName: "Petrov" }
B: WRITE { firstName: "Ivan", lastName: "Doe" }  // ❌ Lost firstName update!
```

#### Решение:

- Pessimistic locking: `findOne({ lock: Transaction.LOCK.UPDATE })`
- Optimistic locking: version field + WHERE version = ?

---

## 📋 Детальный план тестов

### Тест 1: Inventory - Last Item Purchase (5 тестов)

```typescript
describe('Inventory Race Conditions', () => {
    it('должен запретить overselling при concurrent orders', async () => {
        // Setup: product with stock = 1
        // Concurrent: 2 users create orders
        // Assert: только 1 order успешен, 1 получает 409 Conflict
    });

    it('должен корректно декрементить stock при успешном заказе', async () => {
        // Setup: product with stock = 5
        // Action: create order with quantity = 2
        // Assert: stock = 3
    });

    it('должен вернуть 409 при попытке заказать > stock', async () => {
        // Setup: product with stock = 1
        // Action: create order with quantity = 2
        // Assert: 409 Conflict, stock unchanged
    });

    it('должен обработать 10 concurrent orders корректно (stress test)', async () => {
        // Setup: product with stock = 5
        // Concurrent: 10 orders по 1 item
        // Assert: только 5 успешных, остальные 409
    });

    it('должен rollback stock при failure в transaction', async () => {
        // Setup: mock payment failure
        // Action: create order (decrement stock) → payment fails
        // Assert: stock restored
    });
});
```

---

### Тест 2: Cart Concurrent Updates (3 теста)

```typescript
describe('Cart Concurrent Updates', () => {
    it('должен корректно обработать concurrent increments', async () => {
        // Setup: cart with product quantity = 1
        // Concurrent: 5 requests increment same product
        // Assert: final quantity = 6 (не lost updates)
    });

    it('должен корректно обработать concurrent decrement to 0', async () => {
        // Setup: cart with product quantity = 3
        // Concurrent: 3 requests decrement by 1
        // Assert: quantity = 0, product still in cart
    });

    it('должен запретить decrement ниже 0', async () => {
        // Setup: cart with product quantity = 1
        // Concurrent: 2 requests decrement by 1
        // Assert: 1 успешен, 1 получает 400 Bad Request
    });
});
```

---

### Тест 3: Order Concurrent Checkout (2 теста)

```typescript
describe('Order Concurrent Checkout', () => {
    it('должен обработать concurrent checkouts для разных products', async () => {
        // Setup: cart with 2 products
        // Concurrent: user creates order + admin cancels cart
        // Assert: order создан ИЛИ error (не partial state)
    });

    it('должен обработать retry после timeout корректно', async () => {
        // Setup: mock DB timeout
        // Action: create order → timeout → retry
        // Assert: только 1 order создан (idempotency)
    });
});
```

---

### Тест 4: Payment Double-Charge Prevention (2 теста)

```typescript
describe('Payment Idempotency', () => {
    it('должен предотвратить double-charge при duplicate requests', async () => {
        // Setup: order ready for payment
        // Concurrent: 2 identical payment requests
        // Assert: только 1 payment создан (idempotence-key работает)
    });

    it('должен разрешить retry после failure', async () => {
        // Action: payment → 500 error → retry
        // Assert: второй запрос успешен (idempotency на успешных ответах)
    });
});
```

---

### Тест 5: User Concurrent Profile Updates (0 тестов - OPTIONAL)

> **Решение:** Не включать в MVP, т.к. редкий случай (admin updates)

---

## 🎯 DoD для TEST-032

| Критерий                    | Target        | Проверка                                |
| --------------------------- | ------------- | --------------------------------------- |
| **Тесты добавлены**         | +12           | ✅ 12 integration tests                 |
| **Race conditions покрыты** | Все критичные | ✅ Inventory, Cart, Order, Payment      |
| **Pessimistic locking**     | Работает      | ✅ Тесты проходят с concurrent requests |

---

## ⚠️ Критичные находки

### 🔴 CRITICAL:

1. **Inventory overselling** - нет защиты от продажи последнего товара двум покупателям
2. **Payment double-charge** - неправильный idempotency key

### 🟡 HIGH:

3. **Cart lost updates** - concurrent increment/decrement теряют изменения

### 🟢 MEDIUM:

4. **User profile lost updates** - редкий случай, но возможен

---

## 📦 Необходимые изменения в production коде

### Изменение 1: Order Repository - Add Inventory Check

```typescript
// src/infrastructure/repositories/order/order.repository.ts
async createOrderWithInventoryCheck(
    dto: OrderDto,
    userId: number,
    transaction: Transaction,
): Promise<OrderModel> {
    // 1. Lock products FOR UPDATE
    const products = await ProductModel.findAll({
        where: { id: { [Op.in]: orderItemIds } },
        lock: Transaction.LOCK.UPDATE,
        transaction,
    });

    // 2. Check stock availability
    for (const item of dto.items) {
        const product = products.find(p => p.id === item.productId);
        if (!product || product.stock < item.quantity) {
            throw new ConflictException(
                `Недостаточно товара на складе: ${product?.name || item.productId}`
            );
        }
    }

    // 3. Decrement stock atomically
    for (const item of dto.items) {
        await ProductModel.decrement(
            'stock',
            {
                by: item.quantity,
                where: { id: item.productId },
                transaction,
            }
        );
    }

    // 4. Create order
    return this.createOrder(dto, userId, transaction);
}
```

### Изменение 2: Payment Service - Fix Idempotency Key

```typescript
// src/infrastructure/services/payment/payment.service.ts
'Idempotence-Key': `order-${orderId}-payment`,
```

---

## 🚀 Стратегия выполнения TEST-032

### Вариант 1: ⚠️ Tests-First (НЕ рекомендуется)

- Написать тесты → все упадут → фиксить production код → тесты пройдут
- **Проблема:** Production код сломан, тесты долго красные

### Вариант 2: ✅ Fix-Then-Test (рекомендуется)

1. **Создать задачу PROD-040**: Fix Critical Race Conditions
2. **Исправить production код** (inventory, payment idempotency)
3. **Написать TEST-032** для верификации исправлений
4. **Все тесты зелёные** с первого раза

---

## ⏱️ Оценка времени

| Задача                      | Estimate   | Сложность           |
| --------------------------- | ---------- | ------------------- |
| Фикс Inventory (production) | 3-4h       | HIGH                |
| Фикс Payment idempotency    | 1h         | LOW                 |
| Фикс Cart locking           | 2-3h       | MEDIUM              |
| Написание тестов TEST-032   | 4-6h       | MEDIUM              |
| **ИТОГО**                   | **10-14h** | ✅ Matches estimate |

---

## 🎯 Рекомендация

### 📌 Стратегия:

1. **Сначала PROD-040** (Fix Race Conditions):
    - Исправить inventory checking
    - Исправить payment idempotency
    - Добавить cart locking
    - **Estimate:** 6-8h

2. **Потом TEST-032** (Verify Fixes):
    - Написать 12 integration tests
    - Все тесты должны пройти
    - **Estimate:** 4-6h

### ✅ Преимущества:

- Production код сразу исправлен (безопасность)
- Тесты служат регрессионной защитой
- Меньше переключений контекста

---

## 🔄 Альтернатива: TDD подход

Если нужен **строгий TDD**:

1. Написать 1 failing test (например, inventory overselling)
2. Фиксить минимально production код
3. Test проходит → commit
4. Повторить для следующего теста

**Estimate:** +2-3h (больше итераций, но строгий TDD)

---

## 📝 Следующие шаги

**Вопрос:** Какую стратегию выбрать?

- **A)** Fix-Then-Test (быстрее, безопаснее)
- **B)** TDD подход (строгий, дольше)
- **C)** Только TEST-032 без фикса production кода (для Demo)
