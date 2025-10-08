# Known Flaky Tests

**Статус:** Active Issue
**Последнее обновление:** 08.10.2025
**Затронутые тесты:** ~78 из 335 (до 23% flaky rate)

---

## 📊 Общая ситуация

### Метрики нестабильности:

- **Best case:** 335/335 passed (100%) ✅
- **Typical case:** 291-334/335 passed (87-99%) ⚠️
- **Worst case:** 257/335 passed (77%) ❌
- **Средняя стабильность:** ~90% (10% flaky rate)

### Временное решение:

- ✅ `jest.retryTimes(1)` для integration тестов
- ✅ `maxWorkers: 1` для изоляции
- ⚠️ Может потребоваться 2-3 запуска для прохождения всех тестов

---

## 🐛 Корневая причина

### Shared Mutable State:

```typescript
// Все integration тесты используют одних и тех же пользователей:
const SHARED_USERS = {
    user13: 'user@example.com', // используется в 50+ тестах
    user14: 'admin@example.com', // используется в 30+ тестах
};

// Проблема:
// 1. Тесты модифицируют email/phone/роли этих пользователей
// 2. TestCleanup не всегда восстанавливает состояние корректно
// 3. Race conditions при параллельном выполнении
// 4. beforeAll создаёт tokens один раз (устаревают если user изменён)
```

---

## 📝 Список нестабильных тестов

### Критичные (падают часто, >10% fail rate):

#### 1. User Profile Tests (`src/infrastructure/controllers/user/tests/user-profile.integration.test.ts`)

- **Тесты:** 10 тестов
- **Проблема:** Login fails с "Не корректный email" (user 13 изменён)
- **Симптомы:** 500/401 errors при authLoginAs('user')
- **Частота:** ~15% fail rate

#### 2. User Flags Tests (`src/infrastructure/controllers/user/tests/user-flags.integration.test.ts`)

- **Тесты:** 7 тестов
- **Проблема:** Флаги user 13 не сбрасываются между тестами
- **Симптомы:** 403 Forbidden (роль изменена), 401 "Не корректный email"
- **Частота:** ~12% fail rate

#### 3. Auth Flow Tests (`tests/integration/auth-flow.integration.test.ts`)

- **Тесты:** 13 тестов
- **Проблема:** Refresh token rotation failures, cleanup SQL errors
- **Симптомы:** "Failed to get refreshCookie", 500 Internal Server Error
- **Частота:** ~8% fail rate

#### 4. RBAC Tests (`tests/integration/rbac.integration.test.ts`)

- **Тесты:** 6 тестов
- **Проблема:** SQL cleanup errors в afterEach
- **Симптомы:** DELETE FROM login_history failures
- **Частота:** ~10% fail rate

#### 5. User Addresses Tests (`src/infrastructure/controllers/user/tests/user-addresses.integration.test.ts`)

- **Тесты:** 6 тестов
- **Проблема:** User 13 модифицирован другими тестами
- **Симптомы:** 500 Internal Server Error при login
- **Частота:** ~10% fail rate

#### 6. User Verification Tests (`src/infrastructure/controllers/user/tests/user-verification.integration.test.ts`)

- **Тесты:** 6 тестов
- **Проблема:** Email user 13 изменён
- **Симптомы:** 401 "Не корректный email"
- **Частота:** ~8% fail rate

#### 7. User Preferences Tests (`src/infrastructure/controllers/user/tests/user-preferences.integration.test.ts`)

- **Тесты:** 7 тестов
- **Проблема:** User 13 deleted/modified
- **Симптомы:** 401/500 errors при login
- **Частота:** ~10% fail rate

---

## 🔧 Текущие mitigation стратегии

### ✅ Внедрено:

1. **Retry механизм:** `retryTimes: 1` в jest.config.js
2. **Sequential execution:** `maxWorkers: 1` для integration
3. **Test utilities:** TestDataFactory, TestCleanup
4. **SQL logging disabled:** чистый вывод тестов

### ⚠️ Частично работает:

1. **TestCleanup.resetUser13():** сбрасывает флаги/phone, НО НЕ email/роли
2. **TestCleanup.cleanAuthData():** удаляет auth records для новых пользователей
3. **Unique test data:** TestDataFactory.uniqueEmail/Phone (не всегда используется)

### ❌ НЕ работает:

1. **Transaction isolation:** невозможна для HTTP tests
2. **Complete state reset:** слишком дорого (hash паролей)
3. **Parallel execution:** даже `maxWorkers: 2` даёт race conditions

---

## 🎯 Долгосрочное решение

### Рекомендуемый подход (гибридный):

#### Фаза 1: Принять текущую нестабильность (DONE)

- ✅ Retry добавлен
- ✅ Документация создана
- ✅ Тесты проходят в 90% случаев

#### Фаза 2: Новые тесты стабильные (PHASE 2-6 плана)

```typescript
// ✅ ПРАВИЛЬНО - каждый тест создаёт своего пользователя
it('should do something', async () => {
    const uniqueUser = await TestDataFactory.createUser();
    const token = await authLoginAs(app, uniqueUser.email, uniqueUser.password);

    // Тест использует только свои данные

    // Cleanup в afterEach удаляет uniqueUser
});

// ❌ НЕПРАВИЛЬНО - использование shared user
it('should do something', async () => {
    const token = await authLoginAs(app, 'user'); // user 13 - shared!
});
```

#### Фаза 3: Постепенная миграция (background)

- Мигрировать по 10-15 тестов в неделю
- 335 тестов → 22 недели для полной миграции
- Параллельно с основной разработкой

---

## 📊 Impact на CI/CD

### До retry (было):

```
Сценарий 1: Тесты прошли с первого раза (77% вероятность)
→ CI green ✅

Сценарий 2: Тесты упали (23% вероятность)
→ Перезапуск вручную
→ Задержка релиза на 5-30 минут
```

### После retry (сейчас):

```
Сценарий 1: Тесты прошли с первого раза (77% вероятность)
→ CI green ✅

Сценарий 2: Тесты упали, retry прошёл (20% вероятность)
→ CI green ✅ (автоматически)

Сценарий 3: Оба прогона упали (3% вероятность)
→ Перезапуск вручную
→ Вероятно реальный баг
```

**Улучшение:** 77% → 97% success rate ✅

---

## 🚨 Warnings для разработчиков

### При написании новых integration тестов:

❌ **НЕ ДЕЛАТЬ:**

```typescript
// НЕ использовать shared users
const userToken = await authLoginAs(app, 'user');

// НЕ модифицировать user 13/14 напрямую
await sequelize.query(`UPDATE user SET email = 'new@test.com' WHERE id = 13`);

// НЕ полагаться на порядок тестов
```

✅ **ДЕЛАТЬ:**

```typescript
// Создавать unique пользователей
const testUser = await TestDataFactory.createUser();
const token = await authLoginAs(app, testUser.email, testUser.password);

// Cleanup в afterEach
afterEach(async () => {
    await TestCleanup.cleanUsers(sequelize); // удаляет id > 14
});

// Тесты должны быть независимы
```

---

## 📈 План миграции (опционально)

### Приоритет миграции:

**Week 1-2:** Самые нестабильные (>15% fail rate)

- user-profile.integration.test.ts (10 тестов)
- user-flags.integration.test.ts (7 тестов)

**Week 3-4:** Средняя нестабильность (8-15% fail rate)

- auth-flow.integration.test.ts (13 тестов)
- rbac.integration.test.ts (6 тестов)
- user-addresses.integration.test.ts (6 тестов)

**Week 5+:** Низкая нестабильность (<8% fail rate)

- Остальные 287 тестов постепенно

**Итого:** ~22 недели для полной стабилизации

---

## 🔗 Связанные документы

- **Test Plan:** `.cursor/rules/SaaS/testing/testing.coverage.plan.mdc`
- **Investigation Log:** Коммит `a6e73cc` (08.10.2025)
- **Test Utilities:** `tests/utils/` (TestDataFactory, TestCleanup, TestTransaction)

---

## 💡 Для ревьюверов PR

При проверке PR с новыми тестами:

- ✅ Проверить: используются ли unique users (TestDataFactory)
- ✅ Проверить: есть ли cleanup в afterEach
- ❌ Блокировать: использование users 13/14 в новых тестах
- ⚠️ Warning: если тест модифицирует shared state

---

**Статус:** Принято как известная проблема, решается постепенно.
