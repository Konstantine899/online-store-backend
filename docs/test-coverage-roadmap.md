# Test Coverage Roadmap для Online Store (SaaS)

**Цель**: Достижение 70%+ coverage для production-ready SaaS продукта

**Текущее состояние**:
- ✅ 335 тестов (320 passing, 15 failing)
- ❌ Coverage: ~47% functions, ~50% lines
- ✅ Основные flow покрыты (auth, RBAC, CRUD)

**Целевое состояние**:
- ✅ 500+ тестов (100% passing)
- ✅ Coverage: 70%+ global, 85%+ для критичных модулей
- ✅ Все edge cases и error handlers покрыты

---

## Фаза 1: Исправление текущих проблем (Неделя 1-2)

**Приоритет**: 🔴 CRITICAL

### 1.1 Исправить падающие тесты (15 failed)

**Проблема**: Race conditions и проблемы с логином (500 Internal Server Error)

**Решение**:
```typescript
// Изолировать тесты через транзакции
let transaction;

beforeEach(async () => {
    transaction = await sequelize.transaction();
});

afterEach(async () => {
    await transaction.rollback();
});
```

**Файлы для исправления**:
- `src/infrastructure/controllers/user/tests/user-admin.integration.test.ts`
- `src/infrastructure/controllers/user/tests/user-profile.integration.test.ts`
- `src/infrastructure/controllers/user/tests/user-flags.integration.test.ts`
- `src/infrastructure/controllers/user/tests/user-addresses.integration.test.ts`
- `tests/integration/auth-flow.integration.test.ts`
- `tests/integration/rbac.integration.test.ts`

**Критерий готовности**: ✅ 335/335 tests passing

---

### 1.2 Отключить SQL логирование в тестах

**Проблема**: Шум в логах затрудняет отладку

**Решение**:
```typescript
// tests/setup/test-app.module.ts
SequelizeModule.forRoot({
    ...config,
    logging: false, // Принудительно отключить
})
```

**Критерий готовности**: ✅ Чистые логи без SQL запросов

---

## Фаза 2: Auth & Security Tests (Неделя 3-4)

**Приоритет**: 🔴 CRITICAL  
**Целевой coverage**: 85%+

### 2.1 Authentication Flow Tests

**Файл**: `tests/integration/auth-comprehensive.integration.test.ts`

```typescript
describe('Complete Authentication Flow', () => {
    describe('Registration', () => {
        it('should register user with valid data');
        it('should reject duplicate email');
        it('should reject weak password');
        it('should sanitize XSS in name');
        it('should validate phone format');
        it('should send verification email');
    });

    describe('Login', () => {
        it('should login with valid credentials');
        it('should reject invalid password');
        it('should reject unverified email');
        it('should create login history record');
        it('should return accessToken and refreshToken');
    });

    describe('Password Reset', () => {
        it('should send reset email');
        it('should validate reset token');
        it('should reject expired token');
        it('should reject reused token');
        it('should update password successfully');
    });

    describe('Refresh Token', () => {
        it('should refresh with valid token');
        it('should reject expired refresh token');
        it('should implement token rotation');
        it('should revoke old token on refresh');
    });

    describe('Logout', () => {
        it('should revoke refresh token');
        it('should invalidate session');
        it('should clear cookies');
    });
});
```

**Количество тестов**: +30

---

### 2.2 Brute Force Protection Tests

**Файл**: `tests/integration/security/brute-force.integration.test.ts`

```typescript
describe('Brute Force Protection', () => {
    describe('Login Rate Limiting', () => {
        it('should allow 5 attempts within 15 min');
        it('should block 6th attempt');
        it('should reset counter after timeout');
        it('should track by IP address');
        it('should return 429 with Retry-After header');
    });

    describe('Registration Rate Limiting', () => {
        it('should allow 3 registrations per minute');
        it('should block 4th registration');
    });

    describe('Password Reset Rate Limiting', () => {
        it('should limit reset requests per email');
    });
});
```

**Количество тестов**: +12

---

### 2.3 Input Validation & Sanitization Tests

**Файл**: `tests/integration/security/input-validation.integration.test.ts`

```typescript
describe('Input Validation & Sanitization', () => {
    describe('SQL Injection Prevention', () => {
        it('should reject SQL in name field');
        it('should reject SQL in search queries');
        it('should use parameterized queries');
    });

    describe('XSS Prevention', () => {
        it('should sanitize <script> tags');
        it('should sanitize event handlers');
        it('should escape HTML entities');
    });

    describe('NoSQL Injection Prevention', () => {
        it('should reject $where operators');
        it('should validate ObjectId format');
    });

    describe('Path Traversal Prevention', () => {
        it('should reject ../ in file paths');
        it('should validate file uploads');
    });
});
```

**Количество тестов**: +15

---

## Фаза 3: RBAC & Authorization Tests (Неделя 5)

**Приоритет**: 🔴 CRITICAL  
**Целевой coverage**: 85%+

### 3.1 Role-Based Access Control

**Файл**: `tests/integration/rbac-comprehensive.integration.test.ts`

```typescript
describe('RBAC Authorization', () => {
    describe('Role Hierarchy', () => {
        it('SUPER_ADMIN can access all endpoints');
        it('ADMIN can manage users and orders');
        it('MANAGER can view reports');
        it('USER can only access own data');
        it('GUEST has no authenticated access');
    });

    describe('Permission Checks', () => {
        it('should block USER from admin endpoints');
        it('should block MANAGER from user management');
        it('should allow role escalation only by SUPER_ADMIN');
    });

    describe('Multi-Tenant Isolation', () => {
        it('TENANT_ADMIN can only manage own tenant');
        it('should prevent cross-tenant data access');
    });
});
```

**Количество тестов**: +20

---

## Фаза 4: Business Logic & Edge Cases (Неделя 6-7)

**Приоритет**: 🟡 HIGH  
**Целевой coverage**: 70%+

### 4.1 User Management Tests

**Файл**: `tests/integration/user-management-comprehensive.integration.test.ts`

```typescript
describe('User Management', () => {
    describe('User CRUD', () => {
        it('should create user with all fields');
        it('should update user profile');
        it('should delete user (soft delete)');
        it('should restore deleted user');
        it('should handle concurrent updates');
    });

    describe('User Flags', () => {
        it('should toggle all boolean flags');
        it('should track flag changes history');
        it('should prevent invalid flag combinations');
    });

    describe('User Addresses', () => {
        it('should add multiple addresses');
        it('should set default address');
        it('should validate address format');
        it('should handle address deletion');
    });

    describe('User Preferences', () => {
        it('should update language preference');
        it('should update timezone');
        it('should validate JSON preferences');
    });
});
```

**Количество тестов**: +25

---

### 4.2 Error Handling Tests

**Файл**: `tests/integration/error-handling.integration.test.ts`

```typescript
describe('Error Handling', () => {
    describe('Database Errors', () => {
        it('should handle connection timeout');
        it('should handle deadlock retry');
        it('should rollback on constraint violation');
    });

    describe('External Service Errors', () => {
        it('should handle email service failure');
        it('should handle payment gateway timeout');
        it('should implement circuit breaker');
    });

    describe('Validation Errors', () => {
        it('should return 400 with detailed messages');
        it('should validate nested objects');
        it('should handle file upload errors');
    });
});
```

**Количество тестов**: +15

---

### 4.3 Race Condition Tests

**Файл**: `tests/integration/concurrency.integration.test.ts`

```typescript
describe('Concurrency & Race Conditions', () => {
    describe('Order Processing', () => {
        it('should handle simultaneous orders for last item');
        it('should prevent double-spend on cart checkout');
        it('should lock inventory during order');
    });

    describe('User Updates', () => {
        it('should handle concurrent profile updates');
        it('should resolve conflicts with last-write-wins');
    });

    describe('Payment Processing', () => {
        it('should prevent duplicate payment');
        it('should handle payment retry correctly');
    });
});
```

**Количество тестов**: +12

---

## Фаза 5: Coverage Configuration (Неделя 8)

**Приоритет**: 🟡 HIGH

### 5.1 Per-Module Coverage Thresholds

**Файл**: `jest.config.js`

```javascript
coverageThreshold: {
    global: {
        branches: 70,
        functions: 70,
        lines: 75,
        statements: 75
    },
    
    // КРИТИЧНЫЕ МОДУЛИ - 85%+
    './src/infrastructure/services/auth/**/*.ts': {
        branches: 85,
        functions: 85,
        lines: 90,
        statements: 90
    },
    './src/infrastructure/guards/**/*.ts': {
        branches: 85,
        functions: 85,
        lines: 90,
        statements: 90
    },
    './src/infrastructure/services/user/**/*.ts': {
        branches: 80,
        functions: 80,
        lines: 85,
        statements: 85
    },
    
    // ВАЖНЫЕ МОДУЛИ - 70%+
    './src/infrastructure/controllers/**/*.ts': {
        branches: 70,
        functions: 70,
        lines: 75,
        statements: 75
    },
    './src/infrastructure/services/**/*.ts': {
        branches: 65,
        functions: 65,
        lines: 70,
        statements: 70
    },
    
    // Исключения (не требуют высокого coverage)
    './src/**/*.dto.ts': {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0
    },
    './src/**/*.response.ts': {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0
    }
}
```

---

## Фаза 6: E2E Critical Flows (Неделя 9)

**Приоритет**: 🟢 MEDIUM

### 6.1 Complete User Journeys

**Файл**: `tests/e2e/user-journey.e2e.test.ts`

```typescript
describe('Complete User Journeys', () => {
    it('New User Registration → Verification → First Login', async () => {
        // 1. Register
        // 2. Verify email
        // 3. Login
        // 4. Update profile
        // 5. Logout
    });

    it('Shopping Flow: Browse → Cart → Checkout → Order', async () => {
        // 1. Browse products
        // 2. Add to cart
        // 3. Update quantities
        // 4. Checkout
        // 5. Payment
        // 6. Order confirmation
    });

    it('Admin User Management Flow', async () => {
        // 1. Admin login
        // 2. Create user
        // 3. Assign roles
        // 4. Update flags
        // 5. Delete user
    });
});
```

**Количество тестов**: +5

---

## Итоговая статистика

| Фаза | Тестов | Coverage | Приоритет | Недели |
|------|--------|----------|-----------|--------|
| Фаза 1: Исправления | +0 | 47% → 50% | 🔴 CRITICAL | 1-2 |
| Фаза 2: Auth & Security | +57 | 50% → 60% | 🔴 CRITICAL | 3-4 |
| Фаза 3: RBAC | +20 | 60% → 65% | 🔴 CRITICAL | 5 |
| Фаза 4: Business Logic | +52 | 65% → 72% | 🟡 HIGH | 6-7 |
| Фаза 5: Config | +0 | 72% → 75% | 🟡 HIGH | 8 |
| Фаза 6: E2E | +5 | 75% → 75% | 🟢 MEDIUM | 9 |
| **ИТОГО** | **+134** | **47% → 75%** | - | **9 недель** |

---

## Метрики успеха

✅ **Количество тестов**: 335 → 469 (+40%)  
✅ **Coverage global**: 47% → 75% (+60%)  
✅ **Coverage критичных модулей**: 47% → 85%+ (+80%)  
✅ **Passing rate**: 96% → 100%  
✅ **CI pipeline**: Все проверки проходят  

---

## Мониторинг прогресса

### Еженедельные чек-поинты:

```bash
# Неделя N: Проверка прогресса
npm run test:cov

# Ожидаемые результаты:
# Неделя 2: 50% coverage, 0 failed tests
# Неделя 4: 60% coverage, +57 tests
# Неделя 5: 65% coverage, +20 tests
# Неделя 7: 72% coverage, +52 tests
# Неделя 9: 75% coverage, +5 E2E tests
```

---

## Блокеры и риски

### ⚠️ Потенциальные блокеры:

1. **Race conditions в БД**
   - Решение: Транзакции + изоляция тестов

2. **Медленные integration тесты**
   - Решение: Параллелизация + оптимизация БД

3. **Flaky tests**
   - Решение: Retry mechanism + детерминированные данные

4. **Legacy код без тестов**
   - Решение: Refactoring + постепенное покрытие

---

## Следующие шаги

1. ✅ **Одобрить план**
2. 🔄 **Создать ветку**: `git checkout -b test/coverage-improvement`
3. 🔄 **Начать с Фазы 1**: Исправить падающие тесты
4. 🔄 **Еженедельный review**: Проверка прогресса и корректировка плана

---

**Автор**: AI Assistant  
**Дата**: 2025-10-08  
**Статус**: Draft → Ready for Approval

