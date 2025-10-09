/**
 * Константы ролей для системы уведомлений
 * Обеспечивают тенантскую изоляцию и иерархию доступа
 *
 * Оптимизировано для производительности:
 * - Использование Set для быстрого поиска O(1)
 * - Кэширование вычислений
 * - Минимизация аллокаций памяти
 */

// Платформенные роли (глобальный доступ)
export const PLATFORM_ROLES = ['SUPER_ADMIN', 'PLATFORM_ADMIN'] as const;

// Тенантские административные роли
export const TENANT_ADMIN_ROLES = ['TENANT_OWNER', 'TENANT_ADMIN'] as const;

// Роли менеджеров (управление уведомлениями)
export const MANAGER_ROLES = ['MANAGER', 'CONTENT_MANAGER'] as const;

// Роли персонала (просмотр и обслуживание)
export const STAFF_ROLES = ['CUSTOMER_SERVICE'] as const;

// Клиентские роли (управление своими уведомлениями)
export const CUSTOMER_ROLES = [
    'VIP_CUSTOMER',
    'WHOLESALE',
    'CUSTOMER',
    'AFFILIATE',
] as const;

// Гостевые роли (ограниченный доступ)
export const GUEST_ROLES = ['GUEST'] as const;

// Legacy роли для обратной совместимости
export const LEGACY_ROLES = ['ADMIN', 'USER'] as const;

// Группировка ролей по уровням доступа (оптимизировано)
export const ADMIN_ROLES = [
    ...PLATFORM_ROLES,
    ...TENANT_ADMIN_ROLES,
    'ADMIN', // Прямое указание вместо filter для производительности
] as const;

export const ALL_ROLES = [
    ...PLATFORM_ROLES,
    ...TENANT_ADMIN_ROLES,
    ...MANAGER_ROLES,
    ...STAFF_ROLES,
    ...CUSTOMER_ROLES,
    ...GUEST_ROLES,
    ...LEGACY_ROLES,
] as const;

// Кэшированные Set для быстрого поиска O(1)
export const PLATFORM_ROLES_SET = new Set(PLATFORM_ROLES);
export const TENANT_ADMIN_ROLES_SET = new Set(TENANT_ADMIN_ROLES);
export const MANAGER_ROLES_SET = new Set(MANAGER_ROLES);
export const STAFF_ROLES_SET = new Set(STAFF_ROLES);
export const CUSTOMER_ROLES_SET = new Set(CUSTOMER_ROLES);
export const GUEST_ROLES_SET = new Set(GUEST_ROLES);
export const LEGACY_ROLES_SET = new Set(LEGACY_ROLES);
export const ADMIN_ROLES_SET = new Set(ADMIN_ROLES);
export const ALL_ROLES_SET = new Set(ALL_ROLES);

// Типы для TypeScript
export type PlatformRole = (typeof PLATFORM_ROLES)[number];
export type TenantAdminRole = (typeof TENANT_ADMIN_ROLES)[number];
export type ManagerRole = (typeof MANAGER_ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type CustomerRole = (typeof CUSTOMER_ROLES)[number];
export type GuestRole = (typeof GUEST_ROLES)[number];
export type LegacyRole = (typeof LEGACY_ROLES)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AllRole = (typeof ALL_ROLES)[number];

// Константы для проверки доступа (оптимизированы)
export const NOTIFICATION_ACCESS_LEVELS = {
    // Полный доступ ко всем уведомлениям (платформенные роли)
    PLATFORM_FULL: PLATFORM_ROLES,

    // Доступ к уведомлениям тенанта (тенантские роли)
    TENANT_FULL: TENANT_ADMIN_ROLES,

    // Управление шаблонами и настройками (менеджеры)
    TEMPLATE_MANAGEMENT: [...TENANT_ADMIN_ROLES, ...MANAGER_ROLES],

    // Просмотр статистики (менеджеры и персонал)
    STATISTICS_VIEW: [...TENANT_ADMIN_ROLES, ...MANAGER_ROLES, ...STAFF_ROLES],

    // Управление своими уведомлениями (клиенты)
    PERSONAL_MANAGEMENT: CUSTOMER_ROLES,

    // Просмотр уведомлений (все авторизованные)
    NOTIFICATION_VIEW: [
        ...CUSTOMER_ROLES,
        ...STAFF_ROLES,
        ...MANAGER_ROLES,
        ...TENANT_ADMIN_ROLES,
        ...PLATFORM_ROLES,
    ],
} as const;

// Кэшированные Set для быстрой проверки доступа O(1)
export const NOTIFICATION_ACCESS_SETS = {
    PLATFORM_FULL: new Set(PLATFORM_ROLES),
    TENANT_FULL: new Set(TENANT_ADMIN_ROLES),
    TEMPLATE_MANAGEMENT: new Set([...TENANT_ADMIN_ROLES, ...MANAGER_ROLES]),
    STATISTICS_VIEW: new Set([
        ...TENANT_ADMIN_ROLES,
        ...MANAGER_ROLES,
        ...STAFF_ROLES,
    ]),
    PERSONAL_MANAGEMENT: new Set(CUSTOMER_ROLES),
    NOTIFICATION_VIEW: new Set([
        ...CUSTOMER_ROLES,
        ...STAFF_ROLES,
        ...MANAGER_ROLES,
        ...TENANT_ADMIN_ROLES,
        ...PLATFORM_ROLES,
    ]),
} as const;

// Утилиты для быстрой проверки ролей
export const RoleUtils = {
    /**
     * Проверяет, является ли роль платформенной
     */
    isPlatformRole: (role: string): boolean =>
        PLATFORM_ROLES_SET.has(role as PlatformRole),

    /**
     * Проверяет, является ли роль тенантской административной
     */
    isTenantAdminRole: (role: string): boolean =>
        TENANT_ADMIN_ROLES_SET.has(role as TenantAdminRole),

    /**
     * Проверяет, является ли роль менеджерской
     */
    isManagerRole: (role: string): boolean =>
        MANAGER_ROLES_SET.has(role as ManagerRole),

    /**
     * Проверяет, является ли роль персонала
     */
    isStaffRole: (role: string): boolean =>
        STAFF_ROLES_SET.has(role as StaffRole),

    /**
     * Проверяет, является ли роль клиентской
     */
    isCustomerRole: (role: string): boolean =>
        CUSTOMER_ROLES_SET.has(role as CustomerRole),

    /**
     * Проверяет, является ли роль административной
     */
    isAdminRole: (role: string): boolean =>
        ADMIN_ROLES_SET.has(role as AdminRole),

    /**
     * Проверяет, имеет ли роль доступ к определенному уровню
     */
    hasAccess: (
        role: string,
        accessLevel: keyof typeof NOTIFICATION_ACCESS_SETS,
    ): boolean => {
        const accessSet = NOTIFICATION_ACCESS_SETS[accessLevel];
        return (accessSet as Set<string>).has(role);
    },

    /**
     * Проверяет, имеет ли пользователь доступ к уведомлениям
     */
    canViewNotifications: (role: string): boolean => {
        return (NOTIFICATION_ACCESS_SETS.NOTIFICATION_VIEW as Set<string>).has(
            role,
        );
    },

    /**
     * Проверяет, может ли пользователь управлять шаблонами
     */
    canManageTemplates: (role: string): boolean => {
        return (
            NOTIFICATION_ACCESS_SETS.TEMPLATE_MANAGEMENT as Set<string>
        ).has(role);
    },

    /**
     * Проверяет, может ли пользователь просматривать статистику
     */
    canViewStatistics: (role: string): boolean => {
        return (NOTIFICATION_ACCESS_SETS.STATISTICS_VIEW as Set<string>).has(
            role,
        );
    },
} as const;
