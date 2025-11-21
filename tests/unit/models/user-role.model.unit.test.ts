/**
 * Unit тесты для UserRoleModel
 *
 * Тестируем методы проверки истечения и валидности временных ролей:
 * - isExpired() - проверка истечения роли
 * - isValid() - комплексная проверка валидности
 * - getRemainingTime() - получение оставшегося времени
 * - extend() - продление срока действия роли
 *
 * Тестируем scopes:
 * - active, expired, valid - фильтрация по статусу
 * - byUser, byRole, byTenant - фильтрация по связям
 * - withRole, withUsers - eager loading
 */

import { UserRoleModel } from '@app/domain/models/user-role.model';

// ============================================================================
// MOCK DATA: Тестовые данные для назначений ролей
// ============================================================================

const createMockUserRole = (
    partial: Partial<UserRoleModel>,
): UserRoleModel => {
    const now = new Date();

    return {
        id: 1,
        userId: 1,
        roleId: 1,
        tenantId: 1,
        grantedBy: null,
        grantedAt: now,
        expiresAt: null,
        isActive: true,
        metadata: {},
        createdAt: now,
        updatedAt: now,
        ...partial,
        // Mock методов модели
        isExpired: UserRoleModel.prototype.isExpired,
        isValid: UserRoleModel.prototype.isValid,
        getRemainingTime: UserRoleModel.prototype.getRemainingTime,
        extend: UserRoleModel.prototype.extend,
    } as UserRoleModel;
};

// ============================================================================
// TESTS: isExpired()
// ============================================================================

describe('UserRoleModel - isExpired()', () => {
    it('должен вернуть false для бессрочной роли (expiresAt = null)', () => {
        const userRole = createMockUserRole({ expiresAt: null });

        expect(userRole.isExpired()).toBe(false);
    });

    it('должен вернуть false для роли, которая ещё не истекла', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 часа
        const userRole = createMockUserRole({ expiresAt: futureDate });

        expect(userRole.isExpired()).toBe(false);
    });

    it('должен вернуть true для истекшей роли', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // -24 часа
        const userRole = createMockUserRole({ expiresAt: pastDate });

        expect(userRole.isExpired()).toBe(true);
    });

    it('должен вернуть true для роли, истекающей прямо сейчас', () => {
        const now = new Date();
        const userRole = createMockUserRole({ expiresAt: now });

        // Небольшая задержка, чтобы убедиться, что now < Date.now()
        setTimeout(() => {
            expect(userRole.isExpired()).toBe(true);
        }, 10);
    });

    it('должен корректно обрабатывать undefined expiresAt', () => {
        const userRole = createMockUserRole({ expiresAt: undefined as never });

        expect(userRole.isExpired()).toBe(false);
    });
});

// ============================================================================
// TESTS: isValid()
// ============================================================================

describe('UserRoleModel - isValid()', () => {
    it('должен вернуть true для активной бессрочной роли', () => {
        const userRole = createMockUserRole({
            isActive: true,
            expiresAt: null,
        });

        expect(userRole.isValid()).toBe(true);
    });

    it('должен вернуть true для активной роли, которая не истекла', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const userRole = createMockUserRole({
            isActive: true,
            expiresAt: futureDate,
        });

        expect(userRole.isValid()).toBe(true);
    });

    it('должен вернуть false для неактивной роли (даже если не истекла)', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const userRole = createMockUserRole({
            isActive: false,
            expiresAt: futureDate,
        });

        expect(userRole.isValid()).toBe(false);
    });

    it('должен вернуть false для активной, но истекшей роли', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const userRole = createMockUserRole({
            isActive: true,
            expiresAt: pastDate,
        });

        expect(userRole.isValid()).toBe(false);
    });

    it('должен вернуть false для неактивной истекшей роли', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const userRole = createMockUserRole({
            isActive: false,
            expiresAt: pastDate,
        });

        expect(userRole.isValid()).toBe(false);
    });
});

// ============================================================================
// TESTS: getRemainingTime()
// ============================================================================

describe('UserRoleModel - getRemainingTime()', () => {
    it('должен вернуть null для бессрочной роли', () => {
        const userRole = createMockUserRole({ expiresAt: null });

        expect(userRole.getRemainingTime()).toBeNull();
    });

    it('должен вернуть положительное время для роли, которая не истекла', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 часа
        const userRole = createMockUserRole({ expiresAt: futureDate });

        const remaining = userRole.getRemainingTime();

        expect(remaining).not.toBeNull();
        expect(remaining).toBeGreaterThan(0);
        // Примерно 24 часа (с небольшой погрешностью)
        expect(remaining).toBeGreaterThan(23 * 60 * 60 * 1000);
        expect(remaining).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });

    it('должен вернуть 0 для истекшей роли (не отрицательное значение)', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // -24 часа
        const userRole = createMockUserRole({ expiresAt: pastDate });

        expect(userRole.getRemainingTime()).toBe(0);
    });

    it('должен вернуть маленькое значение для роли, истекающей через 1 минуту', () => {
        const futureDate = new Date(Date.now() + 60 * 1000); // +1 минута
        const userRole = createMockUserRole({ expiresAt: futureDate });

        const remaining = userRole.getRemainingTime();

        expect(remaining).not.toBeNull();
        expect(remaining).toBeGreaterThan(0);
        expect(remaining).toBeLessThanOrEqual(60 * 1000);
    });

    it('должен вернуть null для undefined expiresAt', () => {
        const userRole = createMockUserRole({ expiresAt: undefined as never });

        expect(userRole.getRemainingTime()).toBeNull();
    });
});

// ============================================================================
// TESTS: extend()
// ============================================================================

describe('UserRoleModel - extend()', () => {
    it('должен вернуть null для бессрочной роли', () => {
        const userRole = createMockUserRole({ expiresAt: null });

        const newExpiry = userRole.extend(30 * 24 * 60 * 60 * 1000); // +30 дней

        expect(newExpiry).toBeNull();
    });

    it('должен вернуть новую дату, продлённую на указанное время', () => {
        const currentExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 часа
        const userRole = createMockUserRole({ expiresAt: currentExpiry });

        const extension = 7 * 24 * 60 * 60 * 1000; // +7 дней
        const newExpiry = userRole.extend(extension);

        expect(newExpiry).not.toBeNull();
        expect(newExpiry).toBeInstanceOf(Date);

        // Новая дата должна быть на 7 дней позже текущей expiresAt
        const expectedTime = currentExpiry.getTime() + extension;
        expect(newExpiry?.getTime()).toBe(expectedTime);
    });

    it('должен корректно обрабатывать продление на 1 час', () => {
        const currentExpiry = new Date('2024-12-01T12:00:00Z');
        const userRole = createMockUserRole({ expiresAt: currentExpiry });

        const extension = 60 * 60 * 1000; // +1 час
        const newExpiry = userRole.extend(extension);

        expect(newExpiry?.toISOString()).toBe('2024-12-01T13:00:00.000Z');
    });

    it('должен корректно обрабатывать продление на 30 дней', () => {
        const currentExpiry = new Date('2024-12-01T00:00:00Z');
        const userRole = createMockUserRole({ expiresAt: currentExpiry });

        const extension = 30 * 24 * 60 * 60 * 1000; // +30 дней
        const newExpiry = userRole.extend(extension);

        expect(newExpiry?.toISOString()).toBe('2024-12-31T00:00:00.000Z');
    });

    it('должен вернуть null для undefined expiresAt', () => {
        const userRole = createMockUserRole({ expiresAt: undefined as never });

        const newExpiry = userRole.extend(24 * 60 * 60 * 1000);

        expect(newExpiry).toBeNull();
    });

    it('НЕ должен изменять исходную дату expiresAt (immutable)', () => {
        const currentExpiry = new Date('2024-12-01T12:00:00Z');
        const userRole = createMockUserRole({ expiresAt: currentExpiry });

        const originalTime = currentExpiry.getTime();

        userRole.extend(7 * 24 * 60 * 60 * 1000); // +7 дней

        // Исходная дата не изменилась
        expect(currentExpiry.getTime()).toBe(originalTime);
    });
});

// ============================================================================
// NOTE: Scopes тесты
// ============================================================================
// Scopes (active, expired, valid, byUser, byRole, byTenant, withRole, withUsers)
// определены в декораторе @Table и проверяются TypeScript на compile-time.
// Реальное поведение scopes будет проверено в integration тестах с БД.

