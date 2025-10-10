# SEC-001: Invalidate Refresh Tokens on Admin Password Update

**Priority:** 🔴 **CRITICAL**
**Type:** Security Vulnerability
**Created:** 2025-10-10
**Found During:** TEST-030 Code Review
**Status:** 📋 **OPEN**

---

## Executive Summary

При принудительной смене пароля администратором (`UserService.updatePassword`), все активные refresh tokens пользователя **НЕ инвалидируются**. Это создаёт серьёзную уязвимость: злоумышленник может продолжать использовать скомпрометированную сессию даже после смены пароля.

**Severity:** **HIGH** (CVSS ~7.5)
**Impact:** Unauthorized access, session hijacking
**Exploitability:** LOW (requires compromised account + admin intervention)

---

## Problem Description

### Current Implementation

**File:** `src/infrastructure/services/user/user.service.ts:436-451`

```typescript
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

    // ✅ Cache invalidation есть
    this.invalidateUserCache(userId);

    // ❌ НЕТ: Инвалидация refresh tokens
    // ❌ НЕТ: Логирование admin action
    // ❌ НЕТ: Нотификация пользователю
}
```

---

## Attack Scenario

### Scenario 1: Compromised Account Recovery

```
1. Пользователь сообщает: "Мой аккаунт взломан"
2. Админ меняет пароль через updatePassword()
3. Пользователь получает новый пароль
4. ❌ Злоумышленник ПРОДОЛЖАЕТ работать с refresh token
5. ❌ Злоумышленник получает новые access tokens через /auth/refresh
6. Security breach continues!
```

**Expected Behavior:**

```
4. ✅ Все refresh tokens инвалидированы
5. ✅ Злоумышленник получает 401 Unauthorized
6. ✅ Только новый пароль работает
```

---

### Scenario 2: Internal Security Incident

```
1. Security team обнаруживает подозрительную активность
2. Админ сбрасывает пароли всем затронутым аккаунтам
3. ❌ Все пользователи продолжают работать (refresh tokens валидны)
4. Incident response failed!
```

---

## Impact Analysis

### Security Impact

**Confidentiality:** HIGH

- Злоумышленник сохраняет доступ к данным пользователя

**Integrity:** MEDIUM

- Может изменять данные от имени пользователя

**Availability:** LOW

- Не влияет на доступность системы

**CVSS 3.1 Score:** ~7.5 (HIGH)

```
CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:M/A:L
```

---

### Business Impact

**User Trust:** CRITICAL

- Пользователь ожидает, что смена пароля = завершение всех сессий
- Нарушение ожиданий → потеря доверия

**Compliance:** HIGH

- GDPR: Right to security
- PCI DSS: Session management (если есть payments)

**Support Load:** MEDIUM

- Пользователи будут жаловаться на "взлом" после смены пароля

---

## Solution

### Required Changes

#### 1. Add Token Invalidation (CRITICAL)

**File:** `src/infrastructure/services/user/user.service.ts`

```typescript
import { RefreshTokenRepository } from '@app/infrastructure/repositories';

export class UserService {
    constructor(
        // ... existing
        private readonly refreshTokenRepository: RefreshTokenRepository, // ADD
    ) {}

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

        // 🔴 CRITICAL: Invalidate all refresh tokens
        await this.refreshTokenRepository.deleteAllByUserId(userId);

        // Invalidate cache
        this.invalidateUserCache(userId);

        // Log admin action (audit trail)
        this.logger.warn({
            msg: 'Admin force password update',
            userId,
            adminAction: true,
        });
    }
}
```

**Effort:** 30 minutes
**Risk:** LOW (straightforward change)

---

#### 2. Add Notification (RECOMMENDED)

```typescript
// После invalidation:
await this.notificationService.sendPasswordChangedByAdmin(userId, {
    changedAt: new Date(),
    reason: 'Admin security action',
});
```

**Effort:** 1 hour (requires notification template)
**Priority:** MEDIUM

---

#### 3. Add Unit Test

**File:** `src/infrastructure/services/user/user.service.unit.test.ts`

```typescript
describe('updatePassword - Security', () => {
    it('должен инвалидировать все refresh tokens пользователя', async () => {
        userRepository.findUserByPkId.mockResolvedValue(mockUser);
        const deleteTokensMock = jest.fn().mockResolvedValue(5); // 5 tokens deleted
        refreshTokenRepository.deleteAllByUserId = deleteTokensMock;

        await service.updatePassword(1, 'hashed:NewPass123!');

        expect(deleteTokensMock).toHaveBeenCalledWith(1);
    });

    it('должен логировать admin action для audit trail', async () => {
        userRepository.findUserByPkId.mockResolvedValue(mockUser);
        const logSpy = jest.spyOn(service['logger'], 'warn');

        await service.updatePassword(1, 'hashed:NewPass');

        expect(logSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Admin force password update',
                userId: 1,
                adminAction: true,
            }),
        );
    });
});
```

**Effort:** 15 minutes

---

#### 4. Add Integration Test

**File:** `tests/integration/security/password-update-invalidation.integration.test.ts`

```typescript
describe('Password Update - Token Invalidation (e2e)', () => {
    it('смена пароля админом инвалидирует refresh tokens', async () => {
        // 1. Пользователь логинится, получает refresh token
        const { accessToken, refreshCookie } = await loginUser();

        // 2. Админ меняет пароль
        await adminUpdatePassword(userId, 'NewPass123!');

        // 3. Попытка refresh с старым токеном → 401
        const refreshResponse = await request(app.getHttpServer())
            .post('/online-store/auth/refresh')
            .set('Cookie', refreshCookie);

        expect(refreshResponse.status).toBe(401);
        expect(refreshResponse.body.message).toContain('недействительный');
    });
});
```

**Effort:** 1 hour

---

## Testing Plan

### Unit Tests (15 min)

- [x] Test token invalidation call
- [x] Test audit logging
- [ ] Test notification (optional)

### Integration Tests (1h)

- [ ] E2E: login → admin update password → refresh fails
- [ ] E2E: multiple sessions → all invalidated
- [ ] E2E: audit log записывается

### Manual Testing (30 min)

- [ ] Verify в staging environment
- [ ] Check database: refresh_tokens deleted
- [ ] Check logs: admin action logged

---

## Rollout Plan

### Phase 1: Development (2h)

1. Add refresh token invalidation (30 min)
2. Add unit tests (15 min)
3. Add integration tests (1h)
4. Code review (15 min)

### Phase 2: Testing (1h)

1. Run full test suite
2. Manual testing в staging
3. Security review

### Phase 3: Deployment

1. Deploy to staging
2. Monitor logs для anomalies
3. Deploy to production
4. Document в release notes

**Total Effort:** 3-4 hours

---

## Acceptance Criteria

### Must Have

- [ ] Refresh tokens инвалидируются при updatePassword
- [ ] Unit test для token invalidation
- [ ] Integration test для E2E flow
- [ ] Audit log записывается

### Should Have

- [ ] Notification пользователю об изменении пароля
- [ ] Documentation в SECURITY.md
- [ ] Release notes entry

### Nice to Have

- [ ] Metrics для отслеживания admin password updates
- [ ] Alert при подозрительной активности (много password updates)

---

## References

**Related Issues:**

- TEST-030: Code review findings
- TEST-020: Similar cache issue (RoleGuard)

**Similar Patterns:**

- `AuthService.logout()` - правильно инвалидирует токены
- `AuthService.refresh()` - ротация токенов работает

**Standards:**

- OWASP: Session Management Cheat Sheet
- NIST: Password Guidelines

---

## Communication Plan

### Stakeholders

**Security Team:** HIGH priority notification
**Backend Team:** Implementation required
**QA Team:** Test plan review
**Product Team:** User communication plan

### User Communication

**Template:**

```
Ваш пароль был изменён администратором по соображениям безопасности.
Дата: [timestamp]
Все активные сессии завершены.
Пожалуйста, войдите используя новый пароль.
```

---

## Workaround (Temporary)

**До исправления:**

```
Админ должен вручную:
1. Изменить пароль через updatePassword
2. Удалить refresh tokens через SQL:
   DELETE FROM refresh_token WHERE user_id = ?;
3. Уведомить пользователя
```

**Limitation:** Manual process, error-prone

---

**Created by:** AI Assistant
**Assigned to:** Backend Team
**Due Date:** Phase 5 (or earlier if critical)
**Severity:** HIGH
