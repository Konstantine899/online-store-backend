/**
 * Unit тесты для RoleModel
 *
 * Тестируем бизнес-методы работы с иерархией и разрешениями:
 * - hasPermission() - проверка разрешений
 * - canAccessLevel() - проверка доступа к уровню
 * - canManage() - проверка управления ролями
 * - isExpired() - проверка активности
 * - getEffectivePermissions() - получение разрешений
 * - compareHierarchy() - сравнение ролей
 * - getHighestRole() - получение высшей роли
 */

import { RoleModel } from '@app/domain/models/role.model';

// ============================================================================
// MOCK DATA: Тестовые данные для ролей
// ============================================================================

const createMockRole = (partial: Partial<RoleModel>): RoleModel => {
    return {
        id: 1,
        role: 'MANAGER',
        description: 'Менеджер магазина',
        level: 50,
        permissions: [],
        isSystemRole: false,
        isActive: true,
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...partial,
        // Mock методов модели
        hasPermission: RoleModel.prototype.hasPermission,
        canAccessLevel: RoleModel.prototype.canAccessLevel,
        canManage: RoleModel.prototype.canManage,
        isExpired: RoleModel.prototype.isExpired,
        getEffectivePermissions: RoleModel.prototype.getEffectivePermissions,
    } as RoleModel;
};

// ============================================================================
// TESTS: hasPermission()
// ============================================================================

describe('RoleModel - hasPermission()', () => {
    it('должен вернуть true, если разрешение существует', () => {
        const role = createMockRole({
            permissions: [
                { resource: 'products', action: 'create' },
                { resource: 'orders', action: 'read' },
            ],
        });

        expect(role.hasPermission('products', 'create')).toBe(true);
        expect(role.hasPermission('orders', 'read')).toBe(true);
    });

    it('должен вернуть false, если разрешение отсутствует', () => {
        const role = createMockRole({
            permissions: [{ resource: 'products', action: 'create' }],
        });

        expect(role.hasPermission('products', 'delete')).toBe(false);
        expect(role.hasPermission('orders', 'create')).toBe(false);
    });

    it('должен вернуть false, если permissions пустой', () => {
        const role = createMockRole({
            permissions: [],
        });

        expect(role.hasPermission('products', 'create')).toBe(false);
    });

    it('должен вернуть false, если permissions null/undefined', () => {
        const roleWithNull = createMockRole({
            permissions: null as never,
        });
        const roleWithUndefined = createMockRole({
            permissions: undefined as never,
        });

        expect(roleWithNull.hasPermission('products', 'create')).toBe(false);
        expect(roleWithUndefined.hasPermission('products', 'create')).toBe(
            false,
        );
    });

    it('должен игнорировать невалидные объекты в permissions', () => {
        const role = createMockRole({
            permissions: [
                { resource: 'products', action: 'create' }, // валидный
                { resource: 'orders' }, // невалидный (нет action)
                'invalid string', // невалидный (не объект)
                null, // невалидный
            ] as never,
        });

        expect(role.hasPermission('products', 'create')).toBe(true);
        expect(role.hasPermission('orders', 'read')).toBe(false);
    });
});

// ============================================================================
// TESTS: canAccessLevel()
// ============================================================================

describe('RoleModel - canAccessLevel()', () => {
    it('должен вернуть true, если уровень роли выше или равен целевому', () => {
        const adminRole = createMockRole({ level: 60 }); // TENANT_ADMIN

        expect(adminRole.canAccessLevel(60)).toBe(true); // TENANT_ADMIN -> TENANT_ADMIN
        expect(adminRole.canAccessLevel(50)).toBe(true); // TENANT_ADMIN -> MANAGER
        expect(adminRole.canAccessLevel(20)).toBe(true); // TENANT_ADMIN -> CUSTOMER
    });

    it('должен вернуть false, если уровень роли ниже целевого', () => {
        const managerRole = createMockRole({ level: 50 }); // MANAGER

        expect(managerRole.canAccessLevel(60)).toBe(false); // MANAGER -> TENANT_ADMIN
        expect(managerRole.canAccessLevel(100)).toBe(false); // MANAGER -> SUPER_ADMIN
    });

    it('должен корректно работать с граничными значениями', () => {
        const superAdminRole = createMockRole({ level: 100 }); // SUPER_ADMIN
        const guestRole = createMockRole({ level: 5 }); // GUEST

        expect(superAdminRole.canAccessLevel(0)).toBe(true);
        expect(superAdminRole.canAccessLevel(100)).toBe(true);
        expect(guestRole.canAccessLevel(5)).toBe(true);
        expect(guestRole.canAccessLevel(6)).toBe(false);
    });
});

// ============================================================================
// TESTS: canManage()
// ============================================================================

describe('RoleModel - canManage()', () => {
    it('должен вернуть true, если роль может управлять целевой ролью', () => {
        const adminRole = createMockRole({
            role: 'TENANT_ADMIN',
            level: 60,
        });
        const managerRole = createMockRole({
            role: 'MANAGER',
            level: 50,
        });

        expect(adminRole.canManage(managerRole)).toBe(true);
    });

    it('должен вернуть false, если роль не может управлять целевой ролью', () => {
        const managerRole = createMockRole({
            role: 'MANAGER',
            level: 50,
        });
        const adminRole = createMockRole({
            role: 'TENANT_ADMIN',
            level: 60,
        });

        expect(managerRole.canManage(adminRole)).toBe(false);
    });

    it('должен вернуть false, если роли равны по уровню', () => {
        const manager1 = createMockRole({
            role: 'MANAGER',
            level: 50,
        });
        const manager2 = createMockRole({
            role: 'MANAGER',
            level: 50,
        });

        expect(manager1.canManage(manager2)).toBe(false);
    });
});

// ============================================================================
// TESTS: isExpired()
// ============================================================================

describe('RoleModel - isExpired()', () => {
    it('должен вернуть false, если роль активна', () => {
        const role = createMockRole({ isActive: true });

        expect(role.isExpired()).toBe(false);
    });

    it('должен вернуть true, если роль неактивна', () => {
        const role = createMockRole({ isActive: false });

        expect(role.isExpired()).toBe(true);
    });
});

// ============================================================================
// TESTS: getEffectivePermissions()
// ============================================================================

describe('RoleModel - getEffectivePermissions()', () => {
    it('должен вернуть типизированный массив разрешений', () => {
        const role = createMockRole({
            permissions: [
                { resource: 'products', action: 'create' },
                { resource: 'orders', action: 'read' },
                { resource: 'catalog', action: 'manage' },
            ],
        });

        const permissions = role.getEffectivePermissions();

        expect(permissions).toHaveLength(3);
        expect(permissions[0]).toEqual({
            resource: 'products',
            action: 'create',
        });
        expect(permissions[1]).toEqual({ resource: 'orders', action: 'read' });
        expect(permissions[2]).toEqual({
            resource: 'catalog',
            action: 'manage',
        });
    });

    it('должен вернуть пустой массив, если permissions пустой', () => {
        const role = createMockRole({ permissions: [] });

        expect(role.getEffectivePermissions()).toEqual([]);
    });

    it('должен вернуть пустой массив, если permissions null/undefined', () => {
        const roleWithNull = createMockRole({ permissions: null as never });
        const roleWithUndefined = createMockRole({
            permissions: undefined as never,
        });

        expect(roleWithNull.getEffectivePermissions()).toEqual([]);
        expect(roleWithUndefined.getEffectivePermissions()).toEqual([]);
    });

    it('должен фильтровать невалидные объекты в permissions', () => {
        const role = createMockRole({
            permissions: [
                { resource: 'products', action: 'create' }, // валидный
                { resource: 'orders' }, // невалидный (нет action)
                { action: 'read' }, // невалидный (нет resource)
                'invalid string', // невалидный (не объект)
                null, // невалидный
                { resource: 123, action: 'create' }, // невалидный (resource не string)
                { resource: 'users', action: 456 }, // невалидный (action не string)
            ] as never,
        });

        const permissions = role.getEffectivePermissions();

        expect(permissions).toHaveLength(1);
        expect(permissions[0]).toEqual({
            resource: 'products',
            action: 'create',
        });
    });
});

// ============================================================================
// TESTS: compareHierarchy() (static)
// ============================================================================

describe('RoleModel - compareHierarchy() (static)', () => {
    it('должен вернуть 1, если первая роль выше по иерархии', () => {
        const adminRole = createMockRole({ level: 60 });
        const managerRole = createMockRole({ level: 50 });

        expect(RoleModel.compareHierarchy(adminRole, managerRole)).toBe(1);
    });

    it('должен вернуть -1, если первая роль ниже по иерархии', () => {
        const managerRole = createMockRole({ level: 50 });
        const adminRole = createMockRole({ level: 60 });

        expect(RoleModel.compareHierarchy(managerRole, adminRole)).toBe(-1);
    });

    it('должен вернуть 0, если роли равны по уровню', () => {
        const role1 = createMockRole({ level: 50 });
        const role2 = createMockRole({ level: 50 });

        expect(RoleModel.compareHierarchy(role1, role2)).toBe(0);
    });
});

// ============================================================================
// TESTS: getHighestRole() (static)
// ============================================================================

describe('RoleModel - getHighestRole() (static)', () => {
    it('должен вернуть роль с максимальным уровнем', () => {
        const roles = [
            createMockRole({ role: 'CUSTOMER', level: 20 }),
            createMockRole({ role: 'MANAGER', level: 50 }),
            createMockRole({ role: 'TENANT_ADMIN', level: 60 }),
            createMockRole({ role: 'VIP_CUSTOMER', level: 30 }),
        ];

        const highest = RoleModel.getHighestRole(roles);

        expect(highest).not.toBeNull();
        expect(highest?.role).toBe('TENANT_ADMIN');
        expect(highest?.level).toBe(60);
    });

    it('должен вернуть null, если массив пустой', () => {
        expect(RoleModel.getHighestRole([])).toBeNull();
    });

    it('должен вернуть единственную роль, если массив содержит одну роль', () => {
        const role = createMockRole({ role: 'MANAGER', level: 50 });

        const highest = RoleModel.getHighestRole([role]);

        expect(highest).toBe(role);
    });

    it('должен корректно обрабатывать роли с одинаковым уровнем', () => {
        const roles = [
            createMockRole({ role: 'MANAGER_A', level: 50 }),
            createMockRole({ role: 'MANAGER_B', level: 50 }),
            createMockRole({ role: 'MANAGER_C', level: 50 }),
        ];

        const highest = RoleModel.getHighestRole(roles);

        expect(highest).not.toBeNull();
        expect(highest?.level).toBe(50);
        // Должна вернуться первая роль с максимальным уровнем (reduce behaviour)
        expect(['MANAGER_A', 'MANAGER_B', 'MANAGER_C']).toContain(
            highest?.role,
        );
    });
});
