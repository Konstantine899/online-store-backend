# TEST-032: Race Conditions - Specification (Test-First Mindset)

## 🎯 Цель
Предотвратить критичные race conditions в inventory, cart, order, payment

---

## 📋 Спецификация ожидаемого поведения

### 1. Inventory Management

#### 1.1 Overselling Prevention
```
GIVEN product with stock = 1
WHEN 2 concurrent orders for same product
THEN:
  - First order: 201 Created
  - Second order: 409 Conflict "Недостаточно товара на складе"
  - Final stock: 0
```

#### 1.2 Stock Decrement
```
GIVEN product with stock = 5
WHEN order with quantity = 2
THEN:
  - Order: 201 Created
  - Final stock: 3
  - Decrement is atomic (no race conditions)
```

#### 1.3 Insufficient Stock Rejection
```
GIVEN product with stock = 1
WHEN order with quantity = 2
THEN:
  - Order: 409 Conflict
  - Stock unchanged: 1
```

#### 1.4 Transaction Rollback
```
GIVEN product with stock = 5
WHEN order creation fails (e.g., payment error)
THEN:
  - Order: 500 or 400 (depending on error)
  - Stock restored: 5 (rollback)
```

---

### 2. Cart Concurrent Updates

#### 2.1 Concurrent Increments
```
GIVEN cart_product with quantity = 1
WHEN 5 concurrent increments (+1 each)
THEN:
  - Final quantity: 6
  - No lost updates
```

#### 2.2 Concurrent Decrements
```
GIVEN cart_product with quantity = 3
WHEN 3 concurrent decrements (-1 each)
THEN:
  - Final quantity: 0
  - No lost updates
```

#### 2.3 Negative Quantity Prevention
```
GIVEN cart_product with quantity = 1
WHEN 2 concurrent decrements (-1 each)
THEN:
  - First decrement: 200 OK, quantity = 0
  - Second decrement: 400 Bad Request
```

---

### 3. Payment Idempotency

#### 3.1 Double-Charge Prevention
```
GIVEN order ready for payment
WHEN 2 identical payment requests (double-click)
THEN:
  - First request: 200 OK, payment created
  - Second request: 200 OK, same payment (idempotent)
  - Only 1 charge to user
```

#### 3.2 Retry After Failure
```
GIVEN order ready for payment
WHEN payment fails → retry
THEN:
  - First request: 500 Error
  - Retry: 200 OK, payment created
```

---

## 🔧 Требования к реализации

### OrderRepository.createOrder()
```typescript
// MUST use transaction
// MUST lock products (SELECT ... FOR UPDATE)
// MUST check stock availability
// MUST decrement stock atomically
// MUST rollback on failure
```

### CartRepository (increment/decrement)
```typescript
// MUST use atomic operations (UPDATE ... SET quantity = quantity + ?)
// MUST prevent negative quantity
// OR use row-level locking
```

### PaymentService.makePayment()
```typescript
// MUST use deterministic idempotency key
// Format: `order-${orderId}-payment`
// NOT: Date.now() (always different!)
```

---

## ✅ Definition of Done

### Критерии:
1. ✅ Все 4 критичные race conditions исправлены
2. ✅ Production код использует transactions + locking
3. ✅ Integration tests проходят (GREEN)
4. ✅ DoD из testing.coverage.plan.mdc выполнен:
   - +12 тестов проходят
   - Pessimistic locking работает
   - Все критичные race conditions покрыты

---

## 🚀 План выполнения

### Phase 1: Fix Production Code (GREEN)
1. ✅ OrderRepository: Add inventory checking + transactions
2. ✅ PaymentService: Fix idempotency key
3. ✅ CartRepository: Add atomic operations (optional for MVP)

### Phase 2: Write Verification Tests
4. ✅ Integration tests для inventory (5 tests)
5. ✅ Integration tests для cart (3 tests, optional)
6. ✅ Integration tests для payment (2 tests)
7. ✅ Integration tests для order (2 tests, optional)

### Phase 3: Validation
8. ✅ Все тесты GREEN
9. ✅ Coverage check
10. ✅ Commit

---

## 📊 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Critical fixes | 3 | Pending |
| Tests added | +12 | Pending |
| Tests passing | 100% | Pending |
| Estimate | 10-12h | In Progress |


