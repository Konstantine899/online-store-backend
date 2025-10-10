# TEST-030: User Management Comprehensive Tests - Анализ

**Дата анализа:** 2025-10-10
**Статус:** 📋 ПЛАНИРОВАНИЕ
**PHASE:** 4 (Business Logic & Edge Cases)

---

## 1. Краткий контекст и цель

**Контекст:** После успешного завершения PHASE 3 (RBAC Tests) с coverage 92-100% для критичных guards, проект переходит к тестированию бизнес-логики. UserService - один из самых больших и сложных сервисов в системе (978 строк, 37 публичных методов).

**Цель:** Достичь ≥80% coverage для UserService через comprehensive тестирование всех CRUD операций, user flags (20+ флагов), addresses, preferences и concurrent updates.

---

## 2. Текущее состояние

### Существующие тесты

**Unit Tests:** 53 теста существуют

- Location: `src/infrastructure/services/user/tests/user.service.unit.test.ts`
- Status: Passing

**Integration Tests:** ~30 тестов существуют

- `user-admin.integration.test.ts` (admin operations)
- `user-profile.integration.test.ts` (profile updates)
- `user-flags.integration.test.ts` (flags management)
- `user-preferences.integration.test.ts` (preferences)
- `user-addresses.integration.test.ts` (addresses CRUD)
- `user-verification.integration.test.ts` (verification)

### Текущий Coverage

```
UserService (from existing 53 unit tests):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lines:      28.01%  (target: 80%, gap: -51.99%) ❌
Branches:   72.72%  (target: 80%, gap: -7.28%)  🟡
Functions:  11.11%  (target: 80%, gap: -68.89%) ❌
Statements: 28.01%  (target: 80%, gap: -51.99%) ❌
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Вывод:** Нужно добавить значительное количество тестов для достижения 80%

---

## 3. Scope Analysis

### UserService Public Methods (37 total)

#### CRUD Operations (6 methods)

1. ✅ `createUser(dto)` - создание пользователя
2. ✅ `getUser(id)` - получение пользователя
3. ⏳ `getListUsers(page, limit)` - список с пагинацией
4. ⏳ `updateUser(id, dto)` - обновление профиля
5. ⏳ `removeUser(id)` - soft delete
6. ⏳ `restoreUser(userId)` - восстановление

**Current Coverage:** ~33% (2/6)
**Target Coverage:** 100% (6/6)
**Tests to add:** ~4-6 tests

---

#### User Flags (20 methods) - MAJOR SCOPE!

7. ⏳ `verifyEmailFlag(userId)` - верификация email
8. ⏳ `verifyPhoneFlag(userId)` - верификация телефона
9. ⏳ `blockUser(userId)` - блокировка
10. ⏳ `unblockUser(userId)` - разблокировка
11. ⏳ `suspendUser(userId)` - приостановка
12. ⏳ `unsuspendUser(userId)` - возобновление
13. ⏳ `softDeleteUser(userId)` - мягкое удаление
14. ⏳ `upgradePremium(userId)` - премиум upgrade
15. ⏳ `downgradePremium(userId)` - премиум downgrade
16. ⏳ `setEmployee(userId)` - флаг сотрудника
17. ⏳ `unsetEmployee(userId)` - снять флаг
18. ⏳ `setVip(userId)` - VIP статус
19. ⏳ `unsetVip(userId)` - снять VIP
20. ⏳ `setHighValue(userId)` - высокая ценность
21. ⏳ `unsetHighValue(userId)` - снять
22. ⏳ `setWholesale(userId)` - оптовик
23. ⏳ `unsetWholesale(userId)` - снять
24. ⏳ `setAffiliate(userId)` - партнёр
25. ⏳ `unsetAffiliate(userId)` - снять
26. ⏳ `updateFlags(userId, dto)` - массовое обновление

**Current Coverage:** ~10% (2/20)
**Target Coverage:** 100% (20/20)
**Tests to add:** ~18-20 tests

---

#### Password Management (2 methods)

27. ⏳ `changePassword(id, oldPwd, newPwd)` - смена пароля
28. ⏳ `updatePassword(id, newPwd)` - принудительная смена (admin)

**Current Coverage:** 0%
**Target Coverage:** 100%
**Tests to add:** ~4-6 tests (success + errors)

---

#### Preferences & Profile (2 methods)

29. ⏳ `updatePreferences(userId, dto)` - настройки (language, timezone, theme)
30. ✅ `updatePhone(id, phone)` - обновление телефона (EXISTS)

**Current Coverage:** 50% (1/2)
**Target Coverage:** 100%
**Tests to add:** ~2-3 tests

---

#### Role Management (2 methods)

31. ⏳ `addRole(dto)` - назначить роль
32. ⏳ `removeUserRole(dto)` - удалить роль

**Current Coverage:** 0%
**Target Coverage:** 100%
**Tests to add:** ~4-6 tests

---

#### Auth & Verification (3 methods)

33. ✅ `findAuthenticatedUser(userId)` - для auth (EXISTS)
34. ✅ `checkUserAuth(id)` - проверка auth (EXISTS)
35. ✅ `findUserByEmail(email)` - поиск по email (EXISTS)

**Current Coverage:** 100% (3/3)

---

#### Advanced Features (2 methods)

36. ⏳ `requestVerificationCode(userId, type)` - запрос кода
37. ⏳ `confirmVerificationCode(userId, code)` - подтверждение

**Current Coverage:** 0%
**Target Coverage:** 80%
**Tests to add:** ~4-5 tests

---

#### Stats & Analytics (1 method)

38. ⏳ `getUserStats()` - статистика пользователей

**Current Coverage:** 0%
**Target Coverage:** 80%
**Tests to add:** ~2-3 tests

---

## 4. Детальный план (TEST-030)

### Ветка: `test/TEST-030/user-management`

### Estimate: 16-20 hours (из плана)

### Разбивка по атомарным задачам

#### Task 1: CRUD Operations Testing (4-5h)

**Tests:** +6-8

- ✅ `createUser` - success, duplicate email, validation errors
- ✅ `getUser` - found, not found, cached
- ✅ `getListUsers` - pagination, filters, empty results
- ✅ `updateUser` - success, partial update, not found, validation
- ✅ `removeUser` - soft delete, already deleted
- ✅ `restoreUser` - restore, not found, not deleted

**Expected Coverage Gain:** +15-20% lines

---

#### Task 2: User Flags Testing (6-8h) - БОЛЬШАЯ ЗАДАЧА!

**Tests:** +20-25

**Approach:** Parameterized tests для симметричных операций

```typescript
const flagOperations = [
    { set: 'blockUser', unset: 'unblockUser', flag: 'isBlocked' },
    { set: 'suspendUser', unset: 'unsuspendUser', flag: 'isSuspended' },
    { set: 'upgradePremium', unset: 'downgradePremium', flag: 'isPremium' },
    // ... 7 more pairs
];

test.each(flagOperations)(
    '$set should set $flag to true',
    async ({ set, flag }) => {
        // Generic test for all set operations
    },
);
```

**Expected Coverage Gain:** +30-40% lines

---

#### Task 3: Password Management (2-3h)

**Tests:** +6-8

- `changePassword` - success, wrong old password, not found
- `updatePassword` - admin force update, validation, not found
- Password hashing verification
- Password history (if implemented)

**Expected Coverage Gain:** +5-8% lines

---

#### Task 4: Preferences & Addresses (2-3h)

**Tests:** +4-6

- `updatePreferences` - valid updates, validation, partial
- Preferences validation (language, timezone, theme enums)
- Address management (covered by integration tests, skip unit)

**Expected Coverage Gain:** +5-8% lines

---

#### Task 5: Role Management (2-3h)

**Tests:** +6-8

- `addRole` - success, duplicate, role not exists, user not found
- `removeUserRole` - success, role not assigned, last role removal

**Expected Coverage Gain:** +5-8% lines

---

#### Task 6: Concurrent Updates & Race Conditions (1-2h)

**Tests:** +3-5

- Concurrent profile updates (optimistic locking)
- Concurrent flag changes
- Race condition with cache invalidation

**Expected Coverage Gain:** +2-5% lines

---

## 5. Риски и альтернативы

### Риски высокого приоритета

#### Риск 1: Огромный scope (37 методов)

**Описание:** UserService слишком большой для одной задачи (16-20h estimate может быть недостаточно)

**Митигация:**

- **Option A:** Разбить TEST-030 на TEST-030.1 (CRUD), TEST-030.2 (Flags), TEST-030.3 (Advanced)
- **Option B:** Приоритизировать критичные методы (CRUD + flags), остальные - opportunistic
- **Option C:** Использовать parameterized tests максимально (сократить время с 20h до 12-14h)

**Рекомендация:** **Option C** + разбиение если превысим 14h

---

#### Риск 2: Низкий базовый coverage (28%)

**Описание:** Для достижения 80% нужно добавить ~52% coverage = огромный объём тестов

**Митигация:**

- Фокус на hot paths (часто используемые методы)
- Parameterized tests для симметричных операций (set/unset flags)
- Skip trivial getters/setters если есть

**Calculation:**

```
Current: 28% of 978 lines = ~274 lines covered
Target: 80% of 978 lines = ~782 lines covered
Gap: 782 - 274 = 508 lines to cover
Average test covers ~10-15 lines => need 34-51 tests
```

**Estimate adjustment:** 16-20h может быть tight, реально 18-24h

---

#### Риск 3: Cache логика сложная

**Описание:** UserService имеет 3 кэша (user, role, stats) с TTL

**Митигация:**

- Отдельные тесты для cache invalidation
- Mock Date.now() для проверки TTL
- Tests для cache hits/misses

**Additional tests:** +5-8 cache-specific tests

---

### Альтернативные подходы

#### Альтернатива 1: Refactor перед тестированием

**Когда:** Если UserService слишком complex для тестирования

**Что:**

- Извлечь flag operations в отдельный `UserFlagsService`
- Извлечь cache в `UserCacheService`
- Уменьшить UserService до ~300-400 строк

**Время:** +8-12h refactoring, но -4-6h на тестах
**Net:** +4-6h дополнительно

**Recommendation:** **НЕ РЕФАКТОРИТЬ** сейчас, оставить на Phase 5+

---

#### Альтернатива 2: Test Generators

**Когда:** Если flag operations слишком повторяющиеся

**Что:**

```typescript
function generateFlagTests(operations: FlagOperation[]) {
    operations.forEach((op) => {
        it(`${op.set} should set ${op.flag}`, () => {
            /* generated test */
        });
        it(`${op.unset} should unset ${op.flag}`, () => {
            /* generated test */
        });
    });
}
```

**Время:** -30-40% на flag tests
**Quality:** Может быть ниже (generic tests)

**Recommendation:** **Использовать** для flags (экономия 2-3h)

---

## 6. Реализация (предварительный план)

### Атомарная декомпозиция TEST-030

**Разбивка на 6 атомарных подзадач:**

```yaml
TEST-030.1: User CRUD Operations
  - Tests: +8
  - Coverage: +15-20%
  - Time: 4-5h
  - Commit: "feat(testing): TEST-030.1 user CRUD tests"

TEST-030.2: User Flags (part 1: security flags)
  - Tests: +10
  - Coverage: +15-20%
  - Time: 3-4h
  - Commit: "feat(testing): TEST-030.2 security flags tests"

TEST-030.3: User Flags (part 2: business flags)
  - Tests: +10
  - Coverage: +10-15%
  - Time: 3-4h
  - Commit: "feat(testing): TEST-030.3 business flags tests"

TEST-030.4: Password & Preferences Management
  - Tests: +8
  - Coverage: +8-12%
  - Time: 2-3h
  - Commit: "feat(testing): TEST-030.4 password preferences tests"

TEST-030.5: Role Management & Advanced
  - Tests: +8
  - Coverage: +5-8%
  - Time: 2-3h
  - Commit: "feat(testing): TEST-030.5 role management tests"

TEST-030.6: Concurrent Updates & Cache
  - Tests: +6
  - Coverage: +5-8%
  - Time: 2-3h
  - Commit: "feat(testing): TEST-030.6 concurrency cache tests"
```

**Total:**

- Tests: ~50 новых тестов
- Coverage: 28% → 80%+ (gap: +52%)
- Time: 16-22h (в пределах estimate)
- Commits: 6 атомарных коммитов

---

## 7. Методы UserService (приоритизация)

### 🔴 Critical (Must Test - 80%+ coverage)

**CRUD Core:**

1. `createUser` ✅ (частично покрыто)
2. `getUser` ✅ (частично)
3. `updateUser` ❌ (0%)
4. `removeUser` ❌ (0%)
5. `restoreUser` ❌ (0%)

**Security Flags:** 6. `blockUser` ❌ (0%) 7. `unblockUser` ❌ (0%) 8. `suspendUser` ❌ (0%) 9. `unsuspendUser` ❌ (0%) 10. `softDeleteUser` ❌ (0%)

**Password:** 11. `changePassword` ❌ (0%) 12. `updatePassword` ❌ (0%)

---

### 🟡 High Priority (Should Test - 70%+ coverage)

**Business Flags:** 13. `upgradePremium` ❌ 14. `downgradePremium` ❌ 15. `setEmployee/unsetEmployee` ❌ 16. `setVip/unsetVip` ❌ 17. `setHighValue/unsetHighValue` ❌ 18. `setWholesale/unsetWholesale` ❌ 19. `setAffiliate/unsetAffiliate` ❌

**Preferences:** 20. `updatePreferences` ❌ 21. `updateFlags` ❌

---

### 🟢 Medium Priority (Nice to have - 50%+ coverage)

**Advanced:** 22. `requestVerificationCode` ❌ 23. `confirmVerificationCode` ❌ 24. `getUserStats` ❌

**Role Management:** 25. `addRole` ❌ 26. `removeUserRole` ❌

**List:** 27. `getListUsers` ❌

---

### ⚪ Low Priority (Already covered or trivial)

28. `findAuthenticatedUser` ✅ (used by auth tests)
29. `checkUserAuth` ✅ (used by auth tests)
30. `findUserByEmail` ✅ (used by auth tests)
31. `updatePhone` ✅ (EXISTS)

---

## 8. Архитектурные находки (предварительные)

### Cache Management

```typescript
private readonly userCache = new Map<...>();
private readonly roleCache = new Map<...>();
private readonly statsCache = new Map<...>();
private readonly CACHE_TTL = 5 * 60 * 1000;
```

**Concerns:**

- ⚠️ Те же проблемы что и RoleGuard: unbounded cache
- ⚠️ No cache size limit
- ⚠️ TTL может быть слишком агрессивным для stats (10 min)

**Tests Needed:**

- Cache hit/miss scenarios
- TTL expiration
- Cache invalidation on updates
- Memory usage with many users

---

### Single Responsibility Violation?

**Observation:** UserService делает ВСЁ (978 строк)

- CRUD
- 20 flag operations
- Password management
- Role management
- Verification
- Stats
- Caching

**Recommendation:** Рассмотреть рефакторинг после тестов:

```
UserService (core CRUD) - 200 lines
UserFlagsService (flags) - 200 lines
UserSecurityService (password, verification) - 150 lines
UserCacheService (cache management) - 100 lines
UserStatsService (analytics) - 100 lines
```

**Priority:** LOW (не блокирует TEST-030, но улучшит maintainability)

---

## 9. Проверка и критерии готовности (DoD)

### Definition of Done

**Обязательные критерии:**

- [ ] **+25 тестов проходят** (minimum, может быть больше)
- [ ] **UserService coverage ≥80%** (lines, branches, functions, statements)
- [ ] **Все CRUD операции протестированы** (6/6)
- [ ] **Все флаги протестированы** (20/20 или at least critical 10)
- [ ] **Никаких flaky tests** - deterministic execution
- [ ] **Прошёл pre-commit workflow** (Ревью → Автофикс → Тесты → Коммит)

### Success Metrics

**Quantitative:**

```
Tests Added:     ≥ 25 (target), 50-60 realistic
Coverage Gain:   28% → 80% (+52% gap)
Time:            16-20h (estimate), 18-24h realistic
Pass Rate:       100% (0 failed)
```

**Qualitative:**

- Clean test structure (AAA pattern)
- Proper mocking (no real DB in unit tests)
- Comprehensive edge cases
- Good documentation

---

## 10. Следующие шаги и масштабирование

### Immediate (перед запуском TEST-030)

1. **Изучить существующие 53 unit теста** (30 min)
    - Что уже покрыто?
    - Какие patterns используются?
    - Можно ли переиспользовать?

2. **Проверить integration tests** (30 min)
    - Что покрывают user-admin, user-profile, user-flags?
    - Есть ли дублирование с unit tests?
    - Какие сценарии уже работают?

3. **Подготовить Test Data Helpers** (1h)
    - Расширить TestDataFactory для user flags
    - Создать mockUserRepository helper
    - Подготовить fixtures для users

### После завершения TEST-030

4. **Merge и review** (1h)
5. **Update documentation** (30min)
6. **Plan TEST-031** (Error Handling)

---

## 11. Сравнение с TEST-020 (lessons learned)

### Что работало хорошо в TEST-020

✅ **Parameterized tests** - сократили код на 30%
✅ **TestDataFactory** - unique users, no race conditions
✅ **Атомарные коммиты** - по завершении подзадачи
✅ **Pre-commit workflow** - Ревью → Оптимизация → Автофикс

### Что применить к TEST-030

1. **Use test.each() extensively** для flags (20 methods → 10 parameterized tests)
2. **Mock всё** - no real DB, no real bcrypt
3. **Test cache separately** - dedicated describe block
4. **Document findings** - создавать TEST-030-REPORT.md по ходу

---

## 12. TL;DR

**🎯 Цель:** Достичь 80%+ coverage для UserService (978 строк, 37 методов)

**📊 Gap Analysis:**

- Current: 28% coverage (53 tests)
- Target: 80% coverage
- Need: +52% coverage = ~50-60 new tests

**⏱️ Estimate:** 16-20h (план) → 18-24h (реалистично)

**🔑 Ключевые компоненты:**

1. CRUD operations (6 methods) - 4-5h
2. User Flags (20 methods) - 6-8h ← **MAJOR EFFORT**
3. Password management (2 methods) - 2-3h
4. Preferences (1 method) - 1-2h
5. Role management (2 methods) - 2-3h
6. Concurrency & cache (advanced) - 2-3h

**⚠️ Главные риски:**

- Слишком большой scope (может потребовать разбиения на подзадачи)
- Низкий базовый coverage (28%) требует много работы
- Cache логика добавляет complexity

**✅ DoD:** +25 tests (minimum), 80% coverage, все CRUD + flags протестированы

**🚀 Strategy:** Использовать parameterized tests для flags, атомарные коммиты, pre-commit workflow

---

**Готов к запуску?** Дождись триггера **«Одобряю TEST-030»**, затем начинаем с изучения существующих тестов и разработки атомарного плана.
