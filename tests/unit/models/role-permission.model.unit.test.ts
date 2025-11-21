/**
 * Unit тесты для RolePermissionModel
 *
 * Тестируем методы проверки разрешений:
 * - matches() - проверка соответствия resource/action
 * - evaluateConditions() - проверка условий применения разрешения
 * - isWildcard() - проверка на wildcard разрешение
 */

import { RolePermissionModel } from '@app/domain/models/role-permission.model';

// ============================================================================
// MOCK DATA: Тестовые данные для разрешений
// ============================================================================

const createMockPermission = (
    partial: Partial<RolePermissionModel>,
): RolePermissionModel => {
    const now = new Date();

    return {
        id: 1,
        roleId: 1,
        resource: 'products',
        action: 'create',
        conditions: {},
        createdAt: now,
        updatedAt: now,
        ...partial,
        // Mock методов модели
        matches: RolePermissionModel.prototype.matches,
        evaluateConditions:
            RolePermissionModel.prototype.evaluateConditions,
        isWildcard: RolePermissionModel.prototype.isWildcard,
    } as RolePermissionModel;
};

// ============================================================================
// TESTS: matches()
// ============================================================================

describe('RolePermissionModel - matches()', () => {
    it('должен вернуть true, если resource и action совпадают', () => {
        const permission = createMockPermission({
            resource: 'products',
            action: 'create',
        });

        expect(permission.matches('products', 'create')).toBe(true);
    });

    it('должен вернуть false, если resource не совпадает', () => {
        const permission = createMockPermission({
            resource: 'products',
            action: 'create',
        });

        expect(permission.matches('orders', 'create')).toBe(false);
    });

    it('должен вернуть false, если action не совпадает', () => {
        const permission = createMockPermission({
            resource: 'products',
            action: 'create',
        });

        expect(permission.matches('products', 'delete')).toBe(false);
    });

    it('должен вернуть false, если и resource, и action не совпадают', () => {
        const permission = createMockPermission({
            resource: 'products',
            action: 'create',
        });

        expect(permission.matches('orders', 'delete')).toBe(false);
    });

    it('должен быть case-sensitive', () => {
        const permission = createMockPermission({
            resource: 'Products',
            action: 'Create',
        });

        expect(permission.matches('products', 'create')).toBe(false);
        expect(permission.matches('Products', 'Create')).toBe(true);
    });
});

// ============================================================================
// TESTS: evaluateConditions()
// ============================================================================

describe('RolePermissionModel - evaluateConditions()', () => {
    it('должен вернуть true, если conditions пусты', () => {
        const permission = createMockPermission({ conditions: {} });

        expect(permission.evaluateConditions({ anyKey: 'anyValue' })).toBe(
            true,
        );
    });

    it('должен вернуть true, если conditions null', () => {
        const permission = createMockPermission({
            conditions: null as never,
        });

        expect(permission.evaluateConditions({ anyKey: 'anyValue' })).toBe(
            true,
        );
    });

    it('должен вернуть true, если все условия выполнены', () => {
        const permission = createMockPermission({
            conditions: { status: 'active', tenantId: 1 },
        });

        const context = { status: 'active', tenantId: 1 };

        expect(permission.evaluateConditions(context)).toBe(true);
    });

    it('должен вернуть false, если хотя бы одно условие не выполнено', () => {
        const permission = createMockPermission({
            conditions: { status: 'active', tenantId: 1 },
        });

        const context = { status: 'inactive', tenantId: 1 };

        expect(permission.evaluateConditions(context)).toBe(false);
    });

    it('должен вернуть false, если ключ отсутствует в контексте', () => {
        const permission = createMockPermission({
            conditions: { status: 'active', requiredKey: 'value' },
        });

        const context = { status: 'active' }; // requiredKey отсутствует

        expect(permission.evaluateConditions(context)).toBe(false);
    });

    it('должен корректно сравнивать строковые значения', () => {
        const permission = createMockPermission({
            conditions: { role: 'admin' },
        });

        expect(permission.evaluateConditions({ role: 'admin' })).toBe(true);
        expect(permission.evaluateConditions({ role: 'user' })).toBe(false);
    });

    it('должен корректно сравнивать числовые значения', () => {
        const permission = createMockPermission({
            conditions: { minLevel: 50 },
        });

        expect(permission.evaluateConditions({ minLevel: 50 })).toBe(true);
        expect(permission.evaluateConditions({ minLevel: 60 })).toBe(false);
        expect(permission.evaluateConditions({ minLevel: 40 })).toBe(false);
    });

    it('должен корректно сравнивать boolean значения', () => {
        const permission = createMockPermission({
            conditions: { isActive: true },
        });

        expect(permission.evaluateConditions({ isActive: true })).toBe(true);
        expect(permission.evaluateConditions({ isActive: false })).toBe(false);
    });

    it('должен корректно обрабатывать null значения', () => {
        const permission = createMockPermission({
            conditions: { value: null },
        });

        expect(permission.evaluateConditions({ value: null })).toBe(true);
        expect(permission.evaluateConditions({ value: 'something' })).toBe(
            false,
        );
    });

    it('должен корректно обрабатывать undefined значения в conditions', () => {
        const permission = createMockPermission({
            conditions: { value: undefined },
        });

        expect(permission.evaluateConditions({ value: undefined })).toBe(true);
        expect(permission.evaluateConditions({ value: 'something' })).toBe(
            false,
        );
    });

    it('должен проверять все условия (множественные ключи)', () => {
        const permission = createMockPermission({
            conditions: {
                status: 'active',
                tenantId: 1,
                level: 50,
                isAdmin: true,
            },
        });

        // Все условия выполнены
        expect(
            permission.evaluateConditions({
                status: 'active',
                tenantId: 1,
                level: 50,
                isAdmin: true,
            }),
        ).toBe(true);

        // Одно условие не выполнено (status)
        expect(
            permission.evaluateConditions({
                status: 'inactive',
                tenantId: 1,
                level: 50,
                isAdmin: true,
            }),
        ).toBe(false);

        // Одно условие отсутствует (isAdmin)
        expect(
            permission.evaluateConditions({
                status: 'active',
                tenantId: 1,
                level: 50,
            }),
        ).toBe(false);
    });

    it('должен игнорировать дополнительные ключи в контексте', () => {
        const permission = createMockPermission({
            conditions: { status: 'active' },
        });

        const context = {
            status: 'active',
            extraKey1: 'value1',
            extraKey2: 'value2',
        };

        expect(permission.evaluateConditions(context)).toBe(true);
    });
});

// ============================================================================
// TESTS: isWildcard()
// ============================================================================

describe('RolePermissionModel - isWildcard()', () => {
    it('должен вернуть true, если resource = "*"', () => {
        const permission = createMockPermission({
            resource: '*',
            action: 'read',
        });

        expect(permission.isWildcard()).toBe(true);
    });

    it('должен вернуть true, если action = "*"', () => {
        const permission = createMockPermission({
            resource: 'products',
            action: '*',
        });

        expect(permission.isWildcard()).toBe(true);
    });

    it('должен вернуть true, если и resource, и action = "*"', () => {
        const permission = createMockPermission({
            resource: '*',
            action: '*',
        });

        expect(permission.isWildcard()).toBe(true);
    });

    it('должен вернуть false, если ни resource, ни action не "*"', () => {
        const permission = createMockPermission({
            resource: 'products',
            action: 'create',
        });

        expect(permission.isWildcard()).toBe(false);
    });

    it('должен вернуть false для пустых строк', () => {
        const permission = createMockPermission({
            resource: '',
            action: '',
        });

        expect(permission.isWildcard()).toBe(false);
    });
});

// ============================================================================
// NOTE: Scopes тесты
// ============================================================================
// Scopes (byRole, byResource, byAction, byResourceAndAction, withRole)
// определены в декораторе @Table и проверяются TypeScript на compile-time.
// Реальное поведение scopes будет проверено в integration тестах с БД.

