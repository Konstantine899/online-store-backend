# SEC-001: Password Update Token Invalidation - План выполнения

## 🎯 Контекст

**Задача:** Инвалидировать все refresh tokens при admin password update  
**Severity:** 🔴 **CRITICAL** (CVSS 7.5)  
**Found During:** TEST-030 Code Review  
**Impact:** Unauthorized access, session hijacking  
**Estimate:** 3-4 hours  

---

## 🔍 Детальный анализ

### 1. Текущая проблема

#### Код с уязвимостью:
```typescript
// src/infrastructure/services/user/user.service.ts:436-452
public async updatePassword(
    userId: number,
    passwordHash: string,
): Promise<void> {
    const user = await this.userRepository.findUserByPkId(userId);
    if (!user) {
        this.notFound('Пользователь не найден в БД');
    }

    await this.userModel.update(
        { password: passwordHash },
        { where: { id: userId } },
    );

    this.invalidateUserCache(userId);
    
    // ❌ ПРОБЛЕМА: НЕТ инвалидации refresh tokens!
}
```

#### Attack Scenario:
```
1. User: "Мой аккаунт взломан!"
2. Admin: updatePassword(userId, newHash) → Success
3. ✅ Password changed
4. ✅ Cache invalidated
5. ❌ Refresh tokens STILL VALID!
6. ❌ Attacker: /auth/refresh → NEW access token
7. ❌ Breach continues!
```

---

### 2. Правильный паттерн (из AuthService.logout)

#### Существующий код работает правильно:
```typescript
// src/infrastructure/services/auth/auth.service.ts:97-110
public async logout(refresh: RefreshDto, request: Request): Promise<LogoutResponse> {
    const payload = await this.tokenService.decodeRefreshToken(refresh.refreshToken);
    
    // ✅ Правильно: удаляет refresh token
    await this.tokenService.removeRefreshToken(payload.jti, payload.sub);
    
    request.headers.authorization = undefined;
    return { status: HttpStatus.OK, message: 'success' };
}
```

#### TokenService.removeRefreshToken:
```typescript
// src/infrastructure/services/token/token.service.ts:217-227
public async removeRefreshToken(refreshTokenId: number, userId: number): Promise<number> {
    const listRefreshTokens = await this.refreshTokenRepository.findListRefreshTokens(userId);
    
    // Smart logic: если много токенов → удалить все
    if (listRefreshTokens.length > 1) {
        return this.refreshTokenRepository.removeListRefreshTokens(userId);
    }
    
    return this.refreshTokenRepository.removeRefreshToken(refreshTokenId);
}
```

---

### 3. Доступные методы в RefreshTokenRepository

```typescript
// src/infrastructure/repositories/refresh-token/refresh-token.repository.ts

✅ removeListRefreshTokens(userId: number): Promise<number>
   // Удаляет ВСЕ refresh tokens пользователя
   // ИМЕННО ТО ЧТО НУЖНО!

✅ removeRefreshToken(id: number): Promise<number>
   // Удаляет один токен по ID

✅ findListRefreshTokens(userId: number): Promise<RefreshTokenModel[]>
   // Получает все токены пользователя
```

---

## 📋 План исправления

### Атомарная задача 1: Минимальный fix (30 минут)

#### Step 1.1: Inject RefreshTokenRepository
```typescript
// src/infrastructure/services/user/user.service.ts:67-72

constructor(
    private readonly userRepository: UserRepository,
    private roleService: RoleService,
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
    private readonly loginHistoryService: LoginHistoryService,
    private readonly refreshTokenRepository: RefreshTokenRepository, // ADD
) {}
```

#### Step 1.2: Добавить импорт
```typescript
// src/infrastructure/services/user/user.service.ts:16
import { UserRepository, RefreshTokenRepository } from '@app/infrastructure/repositories';
```

#### Step 1.3: Обновить updatePassword
```typescript
// src/infrastructure/services/user/user.service.ts:436-452
public async updatePassword(
    userId: number,
    passwordHash: string,
): Promise<void> {
    const user = await this.userRepository.findUserByPkId(userId);
    if (!user) {
        this.notFound('Пользователь не найден в БД');
    }

    // Update password
    await this.userModel.update(
        { password: passwordHash },
        { where: { id: userId } },
    );

    // 🔴 CRITICAL FIX: Invalidate all refresh tokens
    await this.refreshTokenRepository.removeListRefreshTokens(userId);

    // Invalidate user cache
    this.invalidateUserCache(userId);

    // 🔒 SECURITY: Log admin action for audit trail
    this.logger.warn(
        {
            userId,
            action: 'admin_password_update',
            tokensInvalidated: true,
        },
        'Admin force password update - all sessions terminated',
    );
}
```

**Effort:** 30 minutes  
**Risk:** LOW (simple change)  
**Impact:** HIGH (fixes critical vulnerability)

---

### Атомарная задача 2: Unit tests (30 минут)

#### Test 1: Token invalidation
```typescript
// src/infrastructure/services/user/user.service.unit.test.ts

describe('updatePassword - Security (SEC-001)', () => {
    it('должен инвалидировать все refresh tokens пользователя', async () => {
        userRepository.findUserByPkId.mockResolvedValue(mockUser);
        const deleteTokensMock = jest.fn().mockResolvedValue(3); // 3 tokens deleted
        refreshTokenRepository.removeListRefreshTokens = deleteTokensMock;

        await service.updatePassword(1, 'hashed:NewPass123!');

        expect(deleteTokensMock).toHaveBeenCalledWith(1);
    });

    it('должен логировать admin action для audit trail', async () => {
        userRepository.findUserByPkId.mockResolvedValue(mockUser);
        refreshTokenRepository.removeListRefreshTokens.mockResolvedValue(1);
        
        const logSpy = jest.spyOn(service['logger'], 'warn');

        await service.updatePassword(1, 'hashed:NewPass');

        expect(logSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 1,
                action: 'admin_password_update',
                tokensInvalidated: true,
            }),
            expect.stringContaining('Admin force password update'),
        );
    });

    it('должен всё равно выполниться если токенов нет', async () => {
        userRepository.findUserByPkId.mockResolvedValue(mockUser);
        refreshTokenRepository.removeListRefreshTokens.mockResolvedValue(0);

        await expect(
            service.updatePassword(1, 'hashed:NewPass'),
        ).resolves.not.toThrow();
    });
});
```

**Effort:** 30 minutes  
**Coverage impact:** +3 tests, ~92% → ~94%

---

### Атомарная задача 3: Integration test (1-2 часа)

#### Test file: `tests/integration/security/password-invalidation.integration.test.ts`

```typescript
describe('Password Update Token Invalidation (SEC-001)', () => {
    it('admin password update должен инвалидировать refresh tokens', async () => {
        // 1. Пользователь логинится
        const loginResponse = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send({ email: 'user@test.com', password: 'OldPass123!' });

        const refreshCookie = loginResponse.headers['set-cookie']
            .find(c => c.startsWith('refreshToken='));

        // 2. Админ меняет пароль
        await request(app.getHttpServer())
            .patch(`/online-store/user/admin/password/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ password: 'NewPass123!' });

        // 3. Попытка refresh → 401 Unauthorized
        const refreshResponse = await request(app.getHttpServer())
            .post('/online-store/auth/refresh')
            .set('Cookie', refreshCookie);

        expect(refreshResponse.status).toBe(401);
        expect(refreshResponse.body.message).toContain('недействительный');
    });

    it('пользователь должен войти с новым паролем', async () => {
        // После смены пароля админом
        const loginResponse = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send({ email: 'user@test.com', password: 'NewPass123!' });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toHaveProperty('accessToken');
    });
});
```

**Effort:** 1-2 hours (requires DB setup)  
**Value:** HIGH (E2E verification)

---

### Атомарная задача 4: Documentation update (15 минут)

#### Update SECURITY.md:
```markdown
## ✅ Resolved Security Issues

### SEC-001: Password Update Token Invalidation (RESOLVED)
**Fixed:** 2025-10-10
**Severity:** HIGH (CVSS 7.5)
**Solution:** Automatic refresh token invalidation on admin password update
**Verification:** Unit tests + Integration tests
**Files:** user.service.ts, user.service.unit.test.ts
```

**Effort:** 15 minutes

---

## 🎯 DoD для SEC-001

| Критерий | Status |
|----------|--------|
| ✅ Refresh tokens инвалидируются | Pending |
| ✅ Unit test для invalidation | Pending |
| ✅ Integration test (E2E) | Pending |
| ✅ Audit logging | Pending |
| ✅ SECURITY.md updated | Pending |

---

## ⏱️ Детальная оценка времени

| Задача | Estimate | Complexity |
|--------|----------|------------|
| 1. Minimal fix (inject + call) | 30 min | LOW |
| 2. Unit tests (3 tests) | 30 min | LOW |
| 3. Integration test (E2E) | 1-2h | MEDIUM |
| 4. Documentation update | 15 min | LOW |
| **ИТОГО** | **2.5-3.5h** | ✅ Feasible |

---

## 🚀 Стратегия выполнения

### Вариант A: ✅ **Минимально + Unit tests** (рекомендую)
```
1. Minimal fix (30 min)
2. Unit tests (30 min)
3. Commit
Total: 1h → Production SAFE
```

**Преимущества:**
- Быстро (1h)
- Production готов
- Critical fix done
- Unit tests защищают от regression

**Integration tests** можно добавить позже (не блокирует)

---

### Вариант B: Полная реализация
```
1. Minimal fix (30 min)
2. Unit tests (30 min)
3. Integration test (1-2h)
4. Documentation (15 min)
Total: 2.5-3.5h → Full coverage
```

**Преимущества:**
- Полная верификация
- E2E proof
- Complete DoD

---

### Вариант C: Только minimal fix (для urgent case)
```
1. Inject + call (30 min)
2. Manual testing
3. Deploy
Total: 30 min → Quick fix
```

**Недостатки:**
- Нет автоматических тестов
- Риск regression

---

## 🔒 Security Impact

### Before (❌):
```
Admin: Change password → Success
Attacker: /auth/refresh → NEW access token ✅  // ❌ Still works!
Result: Security breach continues
```

### After (✅):
```
Admin: Change password → Success
System: Invalidate all refresh tokens → 3 tokens deleted
Attacker: /auth/refresh → 401 Unauthorized  // ✅ Blocked!
User: Login with new password → Success
Result: Security restored
```

---

## 📦 Необходимые файлы для изменения

### Production код:
1. `src/infrastructure/repositories/index.ts` - export RefreshTokenRepository (если нет)
2. `src/infrastructure/services/user/user.service.ts` - inject + call

### Tests:
3. `src/infrastructure/services/user/user.service.unit.test.ts` - +3 tests
4. `tests/integration/security/password-invalidation.integration.test.ts` - NEW (optional)

### Docs:
5. `docs/SECURITY.md` - update status
6. `docs/SEC-001-PASSWORD-UPDATE-TOKEN-INVALIDATION.md` - mark as RESOLVED

---

## 🎯 Рекомендация

**Выбрать Вариант A: Minimal + Unit tests (1h)**

**Причины:**
1. ✅ Быстро (1h vs 3-4h)
2. ✅ Production safe сразу
3. ✅ Unit tests достаточно для regression protection
4. ✅ Integration test = nice-to-have (можно позже)
5. ✅ Не блокирует продажу SaaS

**После SEC-001:**
→ Merge to dev
→ TEST-040 (Coverage configuration)
→ TEST-041 (Documentation)
→ **Production ready!** 🚀

---

## 📊 Приоритизация для SaaS

### 🔴 БЛОКИРУЕТ ПРОДАЖУ:
1. **SEC-001** (1h) ← **ВЫ ЗДЕСЬ**
2. Performance critical issues (если есть)
3. Documentation для покупателей

### 🟡 УЛУЧШАЕТ ЦЕНУ:
4. TEST-040 (Coverage thresholds)
5. Integration tests (full coverage)
6. Performance optimization

### 🟢 NICE-TO-HAVE:
7. E2E tests
8. Monitoring/metrics
9. Advanced features

---

## ✅ Готов начать?

**Команда для старта:**
→ "Одобряю SEC-001"

**Или выбери вариант:**
→ "SEC-001 вариант A" (1h, minimal + unit tests)
→ "SEC-001 вариант B" (3h, полная реализация)


